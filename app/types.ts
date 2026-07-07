export interface Keyman {
  氏名: string;
  現役職: string;
  部署: string;
  系統: string;
  役職階層: string;
  優先度: number;
  性別: string;
  "前職・経歴": string;
  歴任: string;
  "発言・記事": string;
  "人事施策への関与": string;
  根拠URL: string;
}

export interface TimelineItem {
  時期: string;
  種別: string;
  テーマ: string;
  内容: string;
  背景: string;
  仮説: string;
  根拠URL: string;
}

export interface HrTransformation {
  時期: string;
  施策: string;
  背景仮説: string;
  根拠URL: string;
}

export interface Challenge {
  課題: string;
  根拠: string;
}

export interface Company {
  name: string;
  name_formal: string;
  tier: string;
  industry: string;
  location: string;
  uriage: string;
  emp_tantai: string;
  emp_renketsu: string;
  listed: string;
  keymen: Keyman[];
  soshiki_ok: boolean;
  soshiki: string;
  soshiki_url: string;
  soshiki_img: string;
  timeline: TimelineItem[];
  hr_transformations: HrTransformation[];
  current_challenges: Challenge[];
  why_you: string;
  why_now: string;
  researched_at: string;
  saiden: string;
  midemi: boolean;
  starred: boolean;
  status: "" | "nurturing" | "rejected";
  memo: string;
  batch_status: string;
}
