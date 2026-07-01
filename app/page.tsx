"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Company, Keyman } from "./types";

function kindClass(kind: string): string {
  if (kind.includes("中期経営計画") || kind.includes("中計")) return "kind-mid";
  if (kind.includes("プレスリリース") || kind.includes("機構改革") || kind.includes("経営統合") || kind.includes("グループ再編")) return "kind-press";
  if (kind.includes("統合報告書") || kind.includes("サステナビリティ") || kind.includes("決算")) return "kind-report";
  if (kind.includes("インタビュー") || kind.includes("役員人事")) return "kind-interview";
  return "kind-other";
}

function tierTag(t: string) { return `tag tag-tier-${t}`; }
function avatarClass(g: string) {
  if (g === "女") return "avatar avatar-f";
  if (g === "男") return "avatar avatar-m";
  return "avatar avatar-u";
}

function renderUrls(url: string | string[]) {
  if (!url) return null;
  const urls = Array.isArray(url) ? url : [url];
  return urls.map((u, i) => (
    <a key={i} className="source-link" href={u} target="_blank" rel="noopener noreferrer">
      出典{urls.length > 1 ? ` ${i + 1}` : ""} →
    </a>
  ));
}

/** Format stat: split number from note */
function StatCard({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return (
    <div className="stat-card"><div className="stat-l">{label}</div><div className="stat-v">—</div></div>
  );
  // Try to split: first part is the main number, parenthetical is the note
  const match = value.match(/^([^（(]+)([（(].+)?$/);
  const main = match ? match[1].trim() : value;
  const note = match && match[2] ? match[2].trim() : "";
  return (
    <div className="stat-card">
      <div className="stat-l">{label}</div>
      <div className="stat-v">{main}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}

/** Career path with down arrows */
function CareerPath({ text }: { text: string }) {
  if (!text || !text.includes("→")) return <span>{text}</span>;
  const steps = text.split("→").map(s => s.trim()).filter(Boolean);
  return (
    <div className="career-path">
      {steps.map((s, i) => (
        <div key={i} className="career-step">
          {i > 0 && <div className="career-arrow">↓</div>}
          <div className="career-label">{s}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Keyman Card (toggleable) ── */
function KeymanCard({ k }: { k: Keyman }) {
  const fields = [
    { label: "前職・経歴", value: k["前職・経歴"], icon: "📋" },
    { label: "歴任", value: k.歴任, icon: "🔄", isCareer: true },
    { label: "発言・記事", value: k["発言・記事"], icon: "💬" },
    { label: "人事施策への関与", value: k["人事施策への関与"], icon: "🎯" },
  ].filter(f => f.value && f.value !== "不明");

  return (
    <details className="km">
      <summary className="km-summary">
        <div className={avatarClass(k.性別)}>{k.氏名.charAt(0)}</div>
        <div className="km-name-area">
          <div className="km-name">{k.氏名}</div>
          <div className="km-role">{k.現役職}</div>
        </div>
        <div className="km-badges">
          <span className={`pri-badge pri-${k.優先度}`}>P{k.優先度}</span>
          <span className="sys-badge">{k.系統}</span>
        </div>
        <span className="km-chev" />
      </summary>
      <div className="km-body">
        {k.部署 && <div className="km-dept">{k.部署}</div>}
        {fields.length > 0 && (
          <div className="km-sections">
            {fields.map((f, i) => (
              <div key={i} className="km-section">
                <div className="km-section-head">
                  <span className="km-section-icon">{f.icon}</span>
                  <span className="km-section-label">{f.label}</span>
                </div>
                <div className="km-section-body">
                  {f.isCareer ? <CareerPath text={f.value} /> : f.value}
                </div>
              </div>
            ))}
          </div>
        )}
        {k.根拠URL && <div className="km-links">{renderUrls(k.根拠URL)}</div>}
      </div>
    </details>
  );
}

/* ── Detail Sheet ── */
function DetailSheet({ company: c, onClose }: { company: Company; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="sheet">
      <header className="sheet-head">
        <div className="head-in">
          <button className="btn-back" onClick={onClose}>← 戻る</button>
          <div>
            <div className="sn">{c.name}</div>
            <div className="sm">{c.industry} · {c.location}</div>
          </div>
          <span className={tierTag(c.tier)}>{c.tier}</span>
          {c.midemi && <span className="tag tag-midemi">見込み</span>}
          <button className="btn-close" onClick={onClose}>閉じる</button>
        </div>
      </header>

      <div className="detail">
        {c.researched_at && <div className="researched-at">調査日: {c.researched_at}</div>}

        {/* Stats */}
        <div className="stat-row">
          <StatCard label="売上高" value={c.uriage} />
          <StatCard label="従業員数（単体）" value={c.emp_tantai} />
          <StatCard label="従業員数（連結）" value={c.emp_renketsu} />
          <StatCard label="上場" value={c.listed} />
        </div>

        {/* Keyman + Org side by side */}
        <div className="row2">
          <div>
            {c.keymen?.length > 0 && (
              <details className="cs" open>
                <summary><h3>キーマン</h3><span className="cs-meta">{c.keymen.length}名</span><span className="chev" /></summary>
                <div className="km-grid">
                  {c.keymen.sort((a, b) => a.優先度 - b.優先度).map((k, i) => <KeymanCard k={k} key={i} />)}
                </div>
              </details>
            )}
          </div>
          <div>
            {c.soshiki_ok && (
              <details className="cs" open>
                <summary><h3>組織情報</h3><span className="chev" /></summary>
                {c.soshiki_img ? (
                  <div className="org-img-wrap"><img src={c.soshiki_img} alt={`${c.name} 組織図`} className="org-img" /></div>
                ) : c.soshiki_url ? (
                  <a className="source-link" href={c.soshiki_url} target="_blank" rel="noopener noreferrer">組織図を確認 →</a>
                ) : c.soshiki ? (
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.8 }}>{c.soshiki}</p>
                ) : null}
              </details>
            )}
          </div>
        </div>

        {/* Timeline + HR Transformations side by side */}
        <div className="row2">
          <div>
            {c.timeline?.length > 0 && (
              <details className="cs" open>
                <summary><h3>タイムライン</h3><span className="cs-meta">{c.timeline.length}件</span><span className="chev" /></summary>
                <div className="tl">
                  {c.timeline.map((t, i) => (
                    <div className="tl-item" key={i}>
                      <div className={`tl-dot ${kindClass(t.種別)}`} />
                      <div className="tl-card">
                        <div className="tl-meta">
                          <span className="tl-date">{t.時期}</span>
                          <span className={`kind-badge ${kindClass(t.種別)}`}>{t.種別}</span>
                        </div>
                        <div className="tl-theme">{t.テーマ}</div>
                        <div className="tl-content">{t.内容}</div>
                        {t.背景 && (
                          <div className="tl-background">
                            <span className="bg-label">背景</span>{t.背景}
                          </div>
                        )}
                        {t.仮説 && (
                          <div className="tl-hypothesis">
                            <span className="hypothesis-label">仮説</span>{t.仮説}
                          </div>
                        )}
                        {t.根拠URL && <div className="tl-links">{renderUrls(t.根拠URL)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
          <div>
            {c.hr_transformations?.length > 0 && (
              <details className="cs" open>
                <summary><h3>人事施策の変遷</h3><span className="cs-meta">{c.hr_transformations.length}件</span><span className="chev" /></summary>
                <div className="hr-list">
                  {c.hr_transformations.map((h, i) => (
                    <div className="hr-item" key={i}>
                      <div className="hr-card">
                        <div className="tl-date">{h.時期}</div>
                        <div className="hr-title">{h.施策}</div>
                        <div className="hr-hypo">{h.背景仮説}</div>
                        {h.根拠URL && <div className="tl-links">{renderUrls(h.根拠URL)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>

        {/* Challenges — full width, outside row2 */}
        {c.current_challenges?.length > 0 && (
          <details className="cs cs-full" open>
            <summary><h3>課題仮説</h3><span className="cs-meta">{c.current_challenges.length}件</span><span className="chev" /></summary>
            <div className="challenges-list">
              {c.current_challenges.map((ch, i) => {
                const isObj = typeof ch === "object" && ch !== null;
                const challenge = isObj ? (ch as {課題: string; 根拠: string}).課題 : String(ch);
                const evidence = isObj ? (ch as {課題: string; 根拠: string}).根拠 : "";
                return (
                  <div className="challenge-item" key={i}>
                    <div className="challenge-main"><span className="challenge-num">{i + 1}</span><span>{challenge}</span></div>
                    {evidence && <div className="challenge-evidence"><span className="evidence-label">根拠:</span> {evidence}</div>}
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {/* Why You / Why Now */}
        {(c.why_you || c.why_now) && (
          <div className="why-row">
            {c.why_you && <div className="why-card why-you"><h3>WHY YOU</h3><p>{c.why_you}</p></div>}
            {c.why_now && <div className="why-card why-now"><h3>WHY NOW</h3><p>{c.why_now}</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ MAIN PAGE ══ */
export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "midemi">("all");
  const [selected, setSelected] = useState<Company | null>(null);

  useEffect(() => {
    fetch("/research_data.json").then(r => r.json()).then((d: Company[]) => setCompanies(d)).catch(() => setCompanies([]));
  }, []);

  const filtered = useMemo(() => {
    let list = companies;
    if (filter === "midemi") list = list.filter(c => c.midemi);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
    }
    return list;
  }, [companies, search, filter]);

  const tierCounts = useMemo(() => {
    const c: Record<string, number> = {};
    companies.forEach(co => { c[co.tier] = (c[co.tier] || 0) + 1; });
    return c;
  }, [companies]);

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <div className="wrap">
      <div className="masthead">
        <div>
          <div className="mast-title">パナリット 事前企業調査シート</div>
          <div className="mast-sub">PRE-CALL RESEARCH / PANALYT</div>
        </div>
        <div className="mast-meta">
          全 <strong>{companies.length}</strong> 社
          {Object.entries(tierCounts).sort(([a],[b]) => a.localeCompare(b)).map(([t, n]) => (
            <span key={t}> / Tier {t}: <strong>{n}</strong></span>
          ))}
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input className="search-input" type="text" placeholder="企業名・業種・所在地で検索…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="seg-ctrl">
          <button className={`seg-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>すべて</button>
          <button className={`seg-btn ${filter === "midemi" ? "active" : ""}`} onClick={() => setFilter("midemi")}>見込みのみ</button>
        </div>
      </div>

      <div className="card-grid">
        {filtered.length === 0 ? (
          <div className="no-results">該当する企業がありません</div>
        ) : filtered.map((c, i) => (
          <div className="card" key={i} onClick={() => setSelected(c)}>
            <div className="card-body">
              <div className="card-top">
                <span className={tierTag(c.tier)}>{c.tier}</span>
                {c.midemi && <span className="tag tag-midemi">見込み</span>}
              </div>
              <div className="card-name">{c.name}</div>
              <div className="card-meta"><span>{c.industry}</span><span>·</span><span>{c.location}</span></div>
              <div className="chips">
                <span className="chip"><b>{c.uriage}</b></span>
                <span className="chip">単体 {c.emp_tantai}</span>
                <span className="chip">{c.listed}</span>
              </div>
              {c.current_challenges?.length > 0 && (
                <ul className="card-challenges">
                  {c.current_challenges.slice(0, 2).map((ch, j) => {
                    const text = typeof ch === "object" && ch !== null ? (ch as {課題: string}).課題 : String(ch);
                    return <li key={j}>{text}</li>;
                  })}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && <DetailSheet company={selected} onClose={handleClose} />}
    </div>
  );
}
