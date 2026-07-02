import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number;
  onChange: (value: number) => void;
};

// ใส่ลูกน้ำหลักพันให้ส่วนจำนวนเต็ม โดยคงส่วนทศนิยมตามที่พิมพ์
function withCommas(raw: string) {
  if (raw === "") return "";
  const [intPart, decPart] = raw.split(".");
  const grouped = intPart.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
  return raw.includes(".") ? `${grouped}.${decPart ?? ""}` : grouped;
}

// จัดรูปแบบเต็ม: ลูกน้ำ + ทศนิยม 2 ตำแหน่ง
function formatFull(n: number) {
  if (!n) return "";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function CurrencyInput({ value, onChange, ...props }: Props) {
  const [text, setText] = useState(() => formatFull(value));

  // sync เมื่อค่าจากภายนอกเปลี่ยน (เช่น สิทธิที่เบิกได้ถูกคำนวณใหม่)
  useEffect(() => {
    const current = Number(text.replace(/,/g, "")) || 0;
    if (current !== value) setText(formatFull(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    if (raw === "") {
      setText("");
      onChange(0);
      return;
    }
    // อนุญาตเฉพาะตัวเลขและจุดทศนิยมไม่เกิน 2 ตำแหน่ง
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return;
    setText(withCommas(raw));
    onChange(Number(raw) || 0);
  };

  const handleBlur = () => {
    setText(formatFull(Number(text.replace(/,/g, "")) || 0));
  };

  return (
    <Input
      {...props}
      inputMode="decimal"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`text-right ${props.className ?? ""}`}
    />
  );
}
