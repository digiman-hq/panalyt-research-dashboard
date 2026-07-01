import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "パナリット 事前企業調査シート",
  description: "PRE-CALL RESEARCH / PANALYT BDR Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
