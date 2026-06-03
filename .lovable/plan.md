## ออกแบบฐานข้อมูล: เก็บประวัติต้นสังกัด (ผู้มีสิทธิ) + ประวัติสถานศึกษา (บุตร)

### หลักการตามที่ยืนยัน
- **ต้นสังกัดผู้มีสิทธิ** → เลือกจาก dropdown (master `schools` มี 27 โรง) ใช้ **FK** + เก็บประวัติการย้าย
- **สถานศึกษาบุตร** → ทั่วประเทศ ไม่ทำ master, **พิมพ์ข้อความอิสระ (text)** + เก็บประวัติการเปลี่ยนสถานศึกษา/ระดับชั้น
- คงคอลัมน์ "ค่าปัจจุบัน" เดิมไว้ (`guardians.school_id`, `children.study_place/education_level/school_type`) เพื่อไม่ให้กระทบโค้ด/รายงานเดิม และให้แสดงผลเร็ว โดยให้ตรงกับแถวประวัติล่าสุดเสมอ

---

### โครงสร้างที่เสนอ (ER overview)

```text
schools (master, 27 โรง)        guardians                       children
  id (PK)                         id (PK)                         id (PK)
  school_name, code, type         school_id → schools (ปัจจุบัน)   study_place (text, ปัจจุบัน)
        ▲                         ...                             education_level, school_type
        │                          │                               │
        │                          │                               │
        └── guardian_affiliation_history     child_education_history
              id (PK)                           id (PK)
              guardian_id → guardians           child_id → children
              school_id → schools  (FK)         study_place (text)        ← พิมพ์อิสระ
              position                          education_level (enum)
              start_date, end_date(null=ปัจจุบัน) school_type (enum)
              is_current (bool)                 academic_year
              note                              start_date, end_date(null=ปัจจุบัน)
                                                is_current (bool)
```

หลักการ: master เก็บเฉพาะต้นสังกัด (มีจำกัด), ส่วนสถานศึกษาบุตรเก็บเป็น text ในตารางประวัติ (ไม่มี FK) เพราะข้อมูลทั่วประเทศและไม่ต้องรวมยอดข้ามคน

---

### 1. Migration ฐานข้อมูล

**ตาราง `guardian_affiliation_history`**
- `guardian_id` → FK `guardians` (on delete cascade)
- `school_id` → FK `schools`
- `position` (text, null), `note` (text, null)
- `start_date` (date), `end_date` (date, null = ปัจจุบัน), `is_current` (bool default true)
- created_at / updated_at + trigger `set_updated_at`
- GRANT ให้ authenticated/service_role, เปิด RLS, policy: staff (admin/finance) จัดการได้ (ใช้ `is_staff(auth.uid())`)

**ตาราง `child_education_history`**
- `child_id` → FK `children` (on delete cascade)
- `study_place` (text), `education_level` (enum education_level, null), `school_type` (enum school_type)
- `academic_year` (int, null)
- `start_date` (date), `end_date` (date, null), `is_current` (bool default true)
- created_at / updated_at + trigger, GRANT, RLS แบบเดียวกัน

**Trigger ช่วยจัดการ is_current** (ต่อ guardian / ต่อ child)
- เมื่อ insert แถวใหม่ที่ `is_current = true` → ตั้ง end_date ของแถว current เดิมเป็นวันก่อนหน้า และ set `is_current = false` อัตโนมัติ (มี current เดียว)

**Migrate ข้อมูลเดิม** (ผ่าน insert tool หลัง migration ผ่าน)
- ทุก guardian ที่มี `school_id` → สร้างแถว affiliation ปัจจุบัน (is_current=true)
- ทุก child ที่มี `study_place` → สร้างแถว education ปัจจุบัน (is_current=true) ดึง level/type จาก children

---

### 2. ปรับ UI

**หน้า `guardians.tsx`**
- คงฟอร์มเดิม (เลือกต้นสังกัดจาก dropdown 27 โรง = ค่าปัจจุบัน)
- เพิ่มปุ่ม "ประวัติ/ย้ายต้นสังกัด" ต่อแถว → Dialog แสดง timeline ประวัติ + ฟอร์มเพิ่มการย้าย (เลือกโรงใหม่ + วันที่มีผล) เมื่อบันทึก: insert แถวประวัติใหม่ และ update `guardians.school_id` ให้เป็นค่าปัจจุบัน

**หน้า `children.tsx`**
- คง field `study_place` เป็น **text input** (ตามข้อ 3)
- เพิ่มปุ่ม "ประวัติ/เปลี่ยนสถานศึกษา" ต่อแถว → Dialog timeline + ฟอร์มเพิ่ม (พิมพ์สถานศึกษาใหม่ + ระดับชั้น + ประเภท + วันที่/ปีการศึกษา) เมื่อบันทึก: insert แถวประวัติ และ update ค่าปัจจุบันใน children

**(ตัวเลือก) รายงาน** — สามารถดึงสถานศึกษา ณ ปีการศึกษาจาก `child_education_history` ได้ในอนาคต

---

### 3. ไม่ทำในรอบนี้
- ไม่ลบคอลัมน์เดิม (`school_id`, `study_place` ฯลฯ) — เก็บเป็นค่าปัจจุบันคู่กับประวัติ
- ไม่แตะ logic การคำนวณเงินเบิก/อัตรา

### หมายเหตุเชิงเทคนิค
- ทุกตารางใหม่ต้องมี GRANT + RLS (staff manage ผ่าน `is_staff`) ในไฟล์ migration เดียวกัน
- การ insert/update ข้อมูลทำผ่าน supabase client ฝั่ง browser (RLS เป็น staff) เหมือนหน้าอื่น ๆ ที่มีอยู่
