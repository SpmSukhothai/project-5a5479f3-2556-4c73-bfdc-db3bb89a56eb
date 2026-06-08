## เป้าหมาย
ขยายระบบอัตราการเบิก (`reimbursement_rates`) ให้รองรับอาชีวศึกษาที่อัตราต่างกันตาม "กลุ่มสาขาวิชา" รวมถึงประเภทการรับเงินอุดหนุน และรูปแบบการเบิกหลายแบบ โดย **คงข้อมูลเดิมไว้ครบ** (migration แบบ additive)

## สรุปการตัดสินใจ (ยืนยันแล้ว)
- education_level: เพิ่ม `vocational_certificate` (ปวช.) และ `higher_vocational` (ปวส.) และ **เก็บ `vocational` เดิมไว้** (ข้อมูลเดิมไม่เปลี่ยน)
- ขอบเขต UI: แก้ทั้ง 3 หน้า — settings + children + reimbursements
- อัตราเดิม 12 แถว: ตั้ง `subsidy_type = none`

## โครงสร้างฐานข้อมูล (migration เดียว — additive, ไม่ลบของเดิม)

### enum ใหม่
- `subsidy_type` = `subsidized`, `non_subsidized`, `none`
- `reimbursement_type` = `fixed_amount`, `half_of_actual`, `percentage`

### เพิ่มค่า enum เดิม
- `education_level` เพิ่ม: `vocational_certificate`, `higher_vocational` (คง `vocational` ไว้)

### ตารางใหม่ `program_groups`
- คอลัมน์: `id`, `code` (unique), `name`, `active` (default true), `created_at`, `updated_at`
- GRANT + RLS: อ่านได้ทุกผู้ล็อกอิน, แก้ไขเฉพาะ admin (`has_role`)
- seed 8 รายการ: business_administration (พาณิชยกรรม), industrial (ช่างอุตสาหกรรม), agriculture (เกษตรกรรม), tourism (ท่องเที่ยว), home_economics (คหกรรม), fisheries (ประมง), fine_arts (ศิลปกรรม), textile (สิ่งทอ)

### ปรับ `reimbursement_rates` (เพิ่มคอลัมน์ ไม่สร้างใหม่)
- `subsidy_type` (NOT NULL, default `none`)
- `program_group_id` uuid (FK → program_groups, **nullable**)
- `reimbursement_type` (NOT NULL, default `fixed_amount`)
- `reimbursement_percent` numeric (nullable)
- `academic_year` มีอยู่แล้ว — คงไว้
- ตั้งค่าแถวเดิม 12 แถว: `subsidy_type = none`, `reimbursement_type = fixed_amount`, `program_group_id = null`
- **Composite unique index**: `(school_type, subsidy_type, education_level, COALESCE(program_group_id,'00000000-0000-0000-0000-000000000000'), academic_year)` — ใช้ sentinel เพราะ NULL ปกติไม่ถูกบังคับ unique

### Validation trigger (ใช้ trigger ไม่ใช้ CHECK)
- ถ้า `education_level` ∈ {vocational_certificate, higher_vocational} → `program_group_id` **required**
- ถ้าเป็นระดับทั่วไป (อนุบาล/ประถม/มัธยม/ปริญญาตรี/vocational เดิม) → `program_group_id` ต้องเป็น **null**
- ใช้ trigger เดียวร่วมกับ `reimbursement_rates`, `children`, `child_education_history`

### ผูกกับข้อมูลบุตร (เพิ่มคอลัมน์)
- `children`: เพิ่ม `subsidy_type` (default none), `program_group_id`
- `child_education_history`: เพิ่ม `subsidy_type` (default none), `program_group_id`
- `reimbursements`: เพิ่ม `subsidy_type` (default none), `program_group_id`, `reimbursement_type`, `reimbursement_percent`
- ข้อมูลเดิมทุกแถว → subsidy_type=none, program_group_id=null (ไม่กระทบ)

## Logic การคำนวณ (lookup ใหม่)
```text
หา rate จากคีย์ 5 ตัว:
  school_type + subsidy_type + education_level
  + program_group_id (null ถ้าไม่ใช่อาชีวะ) + academic_year

คำนวณ entitled ตาม reimbursement_type:
  fixed_amount    → entitled = max_amount
  half_of_actual  → entitled = min(จ่ายจริง/2, max_amount)
  percentage      → entitled = min(จ่ายจริง * percent/100, max_amount)
```
ตัวอย่างที่รองรับ: รัฐ+ประถม→4000 (fixed) ; เอกชนอาชีวะ+อุดหนุน+ปวช+พาณิชยกรรม→5100 ; +ช่างอุตสาหกรรม→7200 ; ปริญญาตรีเอกชน→half_of_actual 50% เพดาน 25000

## การเปลี่ยนแปลงฝั่งโค้ด
- `src/lib/labels.ts`: เพิ่ม `EDU_LEVEL_LABEL` (ปวช./ปวส.), อัปเดต `EDU_LEVELS`, เพิ่ม `SUBSIDY_TYPE_LABEL`, `REIMBURSEMENT_TYPE_LABEL`, helper `VOCATIONAL_LEVELS` และ `computeEntitled(rate, actualPaid)`
- `src/routes/_authenticated/settings.tsx`: เปลี่ยนตารางอัตราเป็น CRUD เต็ม (เพิ่ม/แก้/ลบ) มีคอลัมน์/ฟอร์ม: ประเภทโรงเรียน, subsidy_type, ระดับชั้น, program_group (แสดงเฉพาะเมื่อเลือกระดับอาชีวะ), reimbursement_type, reimbursement_percent (แสดงเมื่อ ≠ fixed_amount), academic_year, max_amount
- `src/routes/_authenticated/children.tsx`: เพิ่ม dropdown subsidy_type และ program_group (แสดง/บังคับเมื่อระดับเป็นอาชีวะ, ซ่อนเมื่อทั่วไป), บันทึกลง children + child_education_history
- `src/routes/_authenticated/reimbursements.tsx`: ดึง subsidy_type/program_group จากข้อมูลบุตร, lookup ด้วยคีย์ครบ 5 ตัว, คำนวณ entitled ตาม reimbursement_type, เพิ่มช่อง subsidy_type + program_group ในฟอร์ม

## หมายเหตุ
- หน้า settings ยังเป็นเฉพาะ admin เหมือนเดิม
- ข้อมูลเดิมทั้งหมดถูก preserve (12 อัตรา, บุตร, รายการเบิก, ประวัติ)
- หลัง migration แอดมินต้องกรอกอัตราอาชีวะรายกลุ่มสาขา (ปวช./ปวส. × กลุ่มสาขา × รับ/ไม่รับอุดหนุน) และอัตราปริญญาตรีเ