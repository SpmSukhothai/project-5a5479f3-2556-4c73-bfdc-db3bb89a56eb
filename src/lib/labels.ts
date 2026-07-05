// อายุสูงสุดที่มีสิทธิเบิก (25 ปีบริบูรณ์)
export const MAX_ELIGIBLE_AGE = 25;

// คำนวณอายุเป็นปีเต็มจากวันเกิด (ISO yyyy-mm-dd); คืน null หากไม่มีวันเกิด
export function calcAge(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

// เกินสิทธิเมื่ออายุ (ปีเต็ม) มากกว่า 25 ปีบริบูรณ์
export function isOverEligibleAge(birthDate?: string | null): boolean {
  const age = calcAge(birthDate);
  return age != null && age > MAX_ELIGIBLE_AGE;
}

export const EDU_LEVEL_LABEL: Record<string, string> = {
  kindergarten: "อนุบาล",
  primary: "ประถมศึกษา",
  lower_secondary: "มัธยมศึกษาตอนต้น",
  upper_secondary: "มัธยมศึกษาตอนปลาย",
  vocational: "ปวช./ปวส. (เดิม)",
  vocational_certificate: "ปวช.",
  higher_vocational: "ปวส.",
  bachelor: "ปริญญาตรี",
};

export const SCHOOL_TYPE_LABEL: Record<string, string> = {
  government: "ราชการ",
  private: "เอกชน",
};

// แสดงชื่อระดับชั้นตามประเภทโรงเรียน (ราชการ: ปวส. => อนุปริญญา)
export function eduLevelLabel(level?: string | null, schoolType?: string | null) {
  if (!level) return "-";
  if (level === "higher_vocational" && schoolType === "government") return "อนุปริญญา";
  return EDU_LEVEL_LABEL[level] ?? level;
}

export const EDU_LEVELS = [
  "kindergarten",
  "primary",
  "lower_secondary",
  "upper_secondary",
  "vocational_certificate",
  "higher_vocational",
  "bachelor",
] as const;

// ระดับอาชีวศึกษาที่ต้องระบุกลุ่มสาขาวิชา
export const VOCATIONAL_LEVELS = ["vocational_certificate", "higher_vocational"] as const;

export function isVocational(level?: string | null) {
  return !!level && (VOCATIONAL_LEVELS as readonly string[]).includes(level);
}

export const SUBSIDY_TYPE_LABEL: Record<string, string> = {
  subsidized: "รับเงินอุดหนุน",
  non_subsidized: "ไม่รับเงินอุดหนุน",
  none: "ไม่เกี่ยวข้อง",
};

export const SUBSIDY_TYPES = ["none", "subsidized", "non_subsidized"] as const;

// ตัวเลือกเงินอุดหนุนสำหรับสถานศึกษาเอกชน (ไม่มี none)
export const PRIVATE_SUBSIDY_TYPES = ["subsidized", "non_subsidized"] as const;

// แสดงตัวเลือกเงินอุดหนุนเฉพาะ "เอกชน" และไม่ใช่ระดับ ปวส. หรือ ปริญญาตรี
export function showsSubsidy(schoolType?: string | null, educationLevel?: string | null) {
  return schoolType === "private" && educationLevel !== "higher_vocational" && educationLevel !== "bachelor";
}

// แสดง/บังคับกลุ่มสาขาวิชาเฉพาะระดับอาชีวศึกษา (ปวช./ปวส.) ที่เป็น "เอกชน"
export function showsProgramGroup(schoolType?: string | null, educationLevel?: string | null) {
  return schoolType === "private" && isVocational(educationLevel);
}

// กรองกลุ่มสาขาตามระดับชั้น (ปวช. = 8 สาขา, ปวส. = 2 กลุ่ม)
export function programGroupsForLevel(groups: any[], level?: string | null) {
  if (!level) return [];
  return groups.filter((g) => (g.level ?? "vocational_certificate") === level);
}

export const REIMBURSEMENT_TYPE_LABEL: Record<string, string> = {
  fixed_amount: "ปีการศึกษาละไม่เกิน",
  half_of_actual: "เบิกครึ่งหนึ่งของจ่ายจริง",
  percentage: "เบิกตามเปอร์เซ็นต์",
};

export const REIMBURSEMENT_TYPES = ["fixed_amount", "half_of_actual"] as const;

// คำนวณสิทธิที่เบิกได้จาก rate และยอดจ่ายจริง
export function computeEntitled(
  rate: { reimbursement_type?: string | null; reimbursement_percent?: number | null; max_amount?: number | null } | null | undefined,
  actualPaid = 0,
): number {
  if (!rate) return 0;
  const max = Number(rate.max_amount ?? 0);
  const paid = Number(actualPaid ?? 0);
  switch (rate.reimbursement_type) {
    case "half_of_actual":
      return Math.min(paid / 2, max);
    case "percentage": {
      const pct = Number(rate.reimbursement_percent ?? 0);
      return Math.min((paid * pct) / 100, max);
    }
    case "fixed_amount":
    default:
      return max;
  }
}

const SENTINEL = "00000000-0000-0000-0000-000000000000";

// หา rate จากคีย์ครบ 5 ตัว
export function findRate(
  rates: any[],
  key: { school_type: string; subsidy_type: string; education_level: string; program_group_id?: string | null; academic_year: number },
) {
  const pg = key.program_group_id || SENTINEL;
  return rates.find(
    (r) =>
      r.school_type === key.school_type &&
      r.subsidy_type === key.subsidy_type &&
      r.education_level === key.education_level &&
      (r.program_group_id || SENTINEL) === pg &&
      r.academic_year === key.academic_year,
  );
}

export function formatTHB(n: number | null | undefined) {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n ?? 0));
}

export function formatThaiDate(d?: string | null) {
  if (!d) return "-";
  const date = new Date(d);
  return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

// รูปแบบวันที่แบบสั้น เช่น "24 เม.ย. 69" (วัน + เดือนย่อ + ปี พ.ศ. 2 หลัก)
export function formatThaiDateShort(d?: string | null) {
  if (!d) return "-";
  const date = new Date(d);
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit" }).format(date);
}

export const ORG_NAME = "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสุโขทัย";
export const SYSTEM_NAME = "ทะเบียนคุมการเบิกเงินค่าการศึกษาบุตร";
