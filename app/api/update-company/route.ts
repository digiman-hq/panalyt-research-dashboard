import { NextRequest, NextResponse } from "next/server";

const GITHUB_REPO = "digiman-hq/panalyt-research-dashboard";
const FILE_PATH = "public/research_data.json";

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN not set" }, { status: 500 });
  }

  const { companyName, updates } = await req.json();
  if (!companyName || !updates) {
    return NextResponse.json({ error: "companyName and updates required" }, { status: 400 });
  }

  try {
    // Get current file from GitHub
    const fileRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" } }
    );
    if (!fileRes.ok) throw new Error("Failed to fetch file from GitHub");
    const fileData = await fileRes.json();

    // Decode content
    const content = Buffer.from(fileData.content, "base64").toString("utf-8");
    const companies = JSON.parse(content);

    // Find and update company
    const idx = companies.findIndex((c: { name: string; name_formal?: string }) =>
      c.name === companyName || c.name_formal === companyName
    );
    if (idx === -1) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Apply updates (flags, memo, etc.)
    Object.assign(companies[idx], updates);

    // Write back to GitHub
    const newContent = Buffer.from(JSON.stringify(companies, null, 2)).toString("base64");
    const updateRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Update ${companyName}: ${Object.keys(updates).join(", ")}`,
          content: newContent,
          sha: fileData.sha,
        }),
      }
    );
    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`GitHub update failed: ${err}`);
    }

    return NextResponse.json({ success: true, company: companies[idx] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
