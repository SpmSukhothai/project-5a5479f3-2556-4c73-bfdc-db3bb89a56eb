export const EDU_LEVEL_LABEL: Record<string, string> = {
  kindergarten: "อนุบาล",
  primary: "ประถมศึกษา",
  lower_secondary: "มัธยมศึกษาตอนต้น",
  upper_secondary: "มัธยมศึกษาตอนปลาย",
  vocational: "ปวช./ปวส.",
  bachelor: "ปริญญาตรี",
};

export const SCHOOL_TYPE_LABEL: Record<string, string> = {
  government: "ราชการ",
  private: "เอกชน",
};

export const EDU_LEVELS = [
  "kindergarten",
  "primary",
  "lower_secondary",
  "upper_secondary",
  "vocational",
  "bachelor",
] as const;

export function formatTHB(n: number | null | undefined) {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n ?? 0));
}

export function formatThaiDate(d?: string | null) {
  if (!d) return "-";
  const date = new Date(d);
  return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export const ORG_NAME = "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสุโขทัย";
export const SYSTEM_NAME = "ทะเบียนคุมการเบิกเงินค่าการศึกษาบุตร";
