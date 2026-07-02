# ซ่อนเงินอุดหนุนสำหรับ "ปริญญาตรี" + "เอกชน"

## เป้าหมาย
ในหน้า `/children` เมื่อระดับชั้นเป็น **ปริญญาตรี (bachelor)** และประเภทสถานศึกษาเป็น **เอกชน (private)** ไม่ต้องแสดงตัวเลือกเงินอุดหนุน (รับ/ไม่รับเงินอุดหนุน)

## การแก้ไข
แก้ที่ตัวช่วยกลาง `showsSubsidy` ใน `src/lib/labels.ts` เพียงจุดเดียว — ปัจจุบันคืนค่า `true` สำหรับเอกชนทุกระดับยกเว้น ปวส. จะเพิ่มเงื่อนไขให้ยกเว้น **ปริญญาตรี** ด้วย

```ts
export function showsSubsidy(schoolType, educationLevel) {
  return schoolType === "private"
    && educationLevel !== "higher_vocational"
    && educationLevel !== "bachelor";
}
```

## ผลที่ตามมา (อัตโนมัติ เพราะใช้ helper เดียวกัน)
- ฟอร์มเพิ่ม/แก้ไขบุตร และฟอร์มเปลี่ยนสถานศึกษาใน `children.tsx`: ช่องเงินอุดหนุนถูกซ่อน และค่า `subsidy_type` ถูกตั้งเป็น `none` โดยอัตโนมัติสำหรับกรณีปริญญาตรีเอกชน (ตรรกะ `normalize`/`onValueChange` มีอยู่แล้ว)
- หน้า `/reimbursements` ที่ใช้ `showsSubsidy` เดียวกัน จะสอดคล้องกันโดยอัตโนมัติ

## ไฟล์ที่แก้
- `src/lib/labels.ts` (แก้ฟังก์ชัน `showsSubsidy` บรรทัดเดียว)

## หมายเหตุ
ไม่ต้องแก้ฐานข้อมูล — `subsidy_type` รองรับค่า `none` อยู่แล้ว
