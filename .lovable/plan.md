## เป้าหมาย
ปรับ logic การคำนวณอัตราค่าการศึกษาบุตรให้รองรับกลุ่มสาขาวิชา (อาชีวศึกษา), ประเภทการรับเงินอุดหนุน และรูปแบบการเบิกหลายแบบ โดยใช้ตารางอ้างอิงแยก (มี id) และผูกกับข้อมูลบุตร

## สรุปการตัดสินใจ (จากที่ยืนยัน)
- `institution_type` = เปลี่ยนชื่อจาก `school_type` (ค่ายังเป็น ราชการ/เอกชน) → ทำเป็นตารางอ้างอิง
- `subsidy_type` = มี 2 ค่า: รับเงินอุดหนุน / ไม่รับเงินอุดหนุน
- โครงสร้าง = ตารางอ้างอิงแยก (มี id)
- ขอบเขต = ผูกกับข้อมูลบุตรด้วย (children / child_education_history / reimbursements)

## โครงสร้างฐานข้อมูล (migration)

ตารางอ้างอิงใหม่ (พร้อม GRANT + RLS อ่านได้ทุกคนที่ล็อกอิน, แก้ไขเฉพาะ admin):
- `institution_types` — code, name_th, sort_order → ราชการ, เอกชน
- `education_levels` — code, name_th, is_vocational, sort_order → อนุบาล, ประถม, ม.ต้น, ม.ปลาย, **ปวช. (vocational_certificate)**, **ปวส. (higher_vocational)**, ปริญญาตรี (แยกอาชีวะออกเป็น 2 ระดับตามที่ระบุ)
- `program_groups` — code, name_th, sort_order → พาณิชยกรรม, ช่างอุตสาหกรรม, เกษตรกรรม, คหกรรม, ศิลปกรรม, ท่องเที่ยว, ประมง, สิ่งทอ

enum ใหม่:
- `subsidy_type` = `subsidized` (รับเงินอุดหนุน), `not_subsidized` (ไม่รับเงินอุดหนุน)
- `reimbursement_type` = `fixed_amount`, `half_of_actual`, `percentage`

ปรับ `reimbursement_rates` (สร้างใหม่ตามโครงสร้างนี้ แล้วย้ายข้อมูลเดิม):
- `institution_type_id` (FK, required)
- `subsidy_type` (required)
- `education_level_id` (FK, required)
- `program_group_id` (FK, **nullable**)
- `academic_year` (required)
- `reimbursement_type` (required, default `fixed_amount`)
- `reimbursement_percent` (nullable) — ใช้กับ percentage/half
- `max_amount` (required)
- **Composite unique index**: (institution_type_id, subsidy_type, education_level_id, COALESCE(program_group_id, sentinel), academic_year) — ใช้ COALESCE เพราะ NULL ปกติไม่ถูกบังคับ unique

Validation (ใช้ trigger ตามแนวทาง ไม่ใช้ CHECK):
- ถ้า education_level เป็นอาชีวะ (is_vocational = true) → `program_group_id` **required**
- ถ้าไม่ใช่อาชีวะ → `program_group_id` **ต้องเป็น null**
- ใช้ trigger เดียวกันกับ `reimbursement_rates`, `children`, `child_education_history`

ปรับตารางที่ผูกข้อมูลบุตร (เพิ่มคอลัมน์ id อ้างอิง + ย้ายข้อมูลเดิม):
- `children`: เพิ่ม `institution_type_id`, `education_level_id`, `program_group_id`
- `child_education_history`: เพิ่ม `institution_type_id`, `education_level_id`, `program_group_id`
- `reimbursements`: เพิ่ม `institution_type_id`, `education_level_id`, `program_group_id`, `subsidy_type`, `reimbursement_type`, `reimbursement_percent`

การย้ายข้อมูลเดิม (ปลอดภัยเพราะข้อมูลน้อย):
- map `school_type` government/private → institution_type_id
- map `education_level` เดิม → education_level_id (แถวที่เป็น `vocational` จะ map เป็น ปวช. ไว้ก่อน ให้แอดมินแก้ภายหลัง)
- เรท 10 แถวทั่วไป → subsidy_type = subsidized, reimbursement_type = fixed_amount, program_group_id = null
- เรท `vocational` 2 แถวเดิม (ราชการ 9,000 / เอกชน 12,000) จะถูกตัดออก เพราะอาชีวะต้องระบุ program_group — ให้แอดมินเพิ่มอัตราต่อสาขาในหน้าตั้งค่า
- คอลัมน์ enum เดิม (`school_type`, `education_level`) จะคงไว้ชั่วคราวเพื่อไม่ให้โค้ดส่วนอื่นพัง แล้วเปลี่ยนโค้ดให้ใช้ id

## การคำนวณ (logic ใหม่)
ฟังก์ชัน lookup อัตราในฟอร์มเบิก:
```text
หา rate จาก:
  institution_type_id + subsidy_type + education_level_id
  + program_group_id (null ถ้าไม่ใช่อาชีวะ) + academic_year
จากนั้นคำนวณ entitled_amount ตาม reimbursement_type:
  fixed_amount    → entitled = max_amount
  half_of_actual  → entitled = min(จ่ายจริง/2, max_amount)
  percentage      → entitled = min(จ่ายจริง * percent/100, max_amount)
```

## การเปลี่ยนแปลงฝั่งโค้ด
- `src/lib/labels.ts`: เพิ่ม label/enum สำหรับ subsidy_type, reimbursement_type, อัปเดต EDU_LEVELS (แยก ปวช./ปวส.), helper คำนวณ entitled
- `src/routes/_authenticated/settings.tsx`: เปลี่ยนตารางอัตราเป็น CRUD เต็มรูปแบบ — เลือกประเภทสถานศึกษา, รับ/ไม่รับเงินอุดหนุน, ระดับชั้น, กลุ่มสาขา (แสดงเฉพาะเมื่อเป็นอาชีวะ), รูปแบบการเบิก, %, เพดาน
- `src/routes/_authenticated/children.tsx`: เปลี่ยน dropdown ให้ดึงจากตารางอ้างอิง, แสดง/บังคับเลือกกลุ่มสาขาเมื่อเป็นอาชีวะ, บันทึก id
- `src/routes/_authenticated/reimbursements.tsx`: ดึง institution/subsidy/level/program จากข้อมูลบุตร, lookup อัตราด้วยคีย์ครบ 5 ตัว, คำนวณ entitled ตาม reimbursement_type, เพิ่มช่อง subsidy_type + program_group ในฟอร์ม

## หมายเหตุ
- หน้าตั้งค่าอัตรายังเป็นเฉพาะ admin เหมือนเดิม
- หลัง migration แอดมินต้องกรอกอัตราอาชีวะรายกลุ่มสาขา (และอัตราแบบ "ไม่รับเงินอุดหนุน" ถ้ามี) ผ่านหน้าตั้งค่า เพราะระบบไม่มีตัวเลขเดิมให้
