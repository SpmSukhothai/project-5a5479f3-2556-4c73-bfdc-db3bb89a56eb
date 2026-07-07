## เป้าหมาย

เตรียมชุดไฟล์ SQL ที่นำไปวางรันบน **Supabase project ภายนอก** (ของคุณเอง) ได้ทันที เพื่อสร้างฐานข้อมูลเหมือนระบบปัจจุบัน ครบทั้งโครงสร้าง ระบบสมัคร/ล็อกอินตามสิทธิ (admin/finance) และข้อมูลจริงทั้งหมด พร้อมคู่มือการเชื่อมต่อแอป

> ระบบนี้ทำงานบน Lovable Cloud อยู่ ไฟล์ที่สร้างจะเป็น **ไฟล์สำหรับส่งออก** ไปรันเองบน Supabase ภายนอก ไม่แตะฐานข้อมูลปัจจุบัน

## ไฟล์ที่จะสร้าง (โฟลเดอร์ `supabase/external-export/`)

```text
supabase/external-export/
  01_schema.sql       โครงสร้าง + สิทธิ + Auth ทั้งหมด
  02_seed_data.sql    ข้อมูลจริงทุกตาราง
  README.md           คู่มือติดตั้ง + เชื่อมต่อแอป
```

### 1. `01_schema.sql` — โครงสร้าง สิทธิ และ Auth
รวมทุกอย่างจาก migration ทั้ง 12 ไฟล์เป็นไฟล์เดียว เรียงลำดับถูกต้อง:
- **Enums**: `app_role` (admin/finance), `school_type`, `education_level` (รวมค่าที่เพิ่มภายหลัง เช่น ปวช./ปวส.)
- **11 ตาราง**: profiles, user_roles, schools, guardians, children, program_groups, child_education_history, guardian_affiliation_history, reimbursement_rates, reimbursements, audit_log
- **ฟังก์ชัน**: has_role, is_staff, handle_new_user, check_child_limit, set_registration_no, set_updated_at, close_prev_education, close_prev_affiliation, validate_program_group, write_audit_log
- **Triggers**: รวม `on_auth_user_created` บน `auth.users` (ผู้สมัครคนแรก = admin อัตโนมัติ, คนถัดไป = finance)
- **RLS + GRANT ครบทุกตาราง** — ระบบสิทธิ admin/finance ทำงานเหมือนเดิม
- Seed ค่าเริ่มต้นเชิงโครงสร้าง (program_groups, reimbursement_rates) ถ้าถือเป็นค่าตั้งต้นของระบบ

### 2. `02_seed_data.sql` — ข้อมูลจริง
สร้างจากข้อมูลจริงในฐานข้อมูลปัจจุบัน (ดึงด้วย query แล้วแปลงเป็น `INSERT`):
- schools (27), guardians (3), children (5), program_groups (10)
- child_education_history (6), guardian_affiliation_history (1)
- reimbursement_rates (33), reimbursements (4)
- ใส่ `ON CONFLICT DO NOTHING` เพื่อรันซ้ำได้ปลอดภัย

**ข้อจำกัดเรื่องผู้ใช้ (สำคัญ):** ตาราง `profiles` / `user_roles` และคอลัมน์ `reimbursements.created_by` ผูกกับ `auth.users` ซึ่ง**ส่งออกด้วย SQL ไม่ได้** (รหัสผ่านถูกเข้ารหัส และ user id จะไม่ตรงกันข้ามโปรเจกต์) วิธีจัดการ:
- ไม่ seed `profiles`/`user_roles` — ให้ผู้ใช้ **สมัครใหม่** บน Supabase ภายนอก โดยคนแรกจะได้สิทธิ admin อัตโนมัติผ่าน trigger
- `reimbursements.created_by` จะตั้งเป็น `NULL` ในไฟล์ seed (ข้อมูลการเบิกยังครบทุกอย่าง)
- README อธิบายวิธีให้ admin ปรับสิทธิ finance ให้ผู้ใช้อื่นภายหลัง

### 3. `README.md` — คู่มือ
- ขั้นตอนสร้าง Supabase project ใหม่ → เปิด SQL Editor → รัน `01_schema.sql` แล้ว `02_seed_data.sql`
- เปิด Email auth และ (ถ้าต้องการ) Google provider
- ค่าที่ต้องนำมาเปลี่ยนในแอป: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key), `VITE_SUPABASE_PROJECT_ID` และฝั่ง server `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- หมายเหตุ: บน Lovable Cloud ไฟล์ `.env` ถูกจัดการอัตโนมัติและอาจถูกเขียนทับ การชี้ไป Supabase ภายนอกจริง ๆ แนะนำทำตอน self-host / deploy นอก Lovable

## สิ่งที่ไม่แตะ
- ไม่แก้ฐานข้อมูล/แอปปัจจุบัน — สร้างเฉพาะไฟล์ส่งออก
- ไม่แตะ `src/integrations/supabase/*` (auto-generated)

## รายละเอียดเชิงเทคนิค
- ไฟล์ seed สร้างโดย query ข้อมูลจริงผ่าน psql แล้ว generate `INSERT` (จัดการ escape ภาษาไทย/quote ให้ถูกต้อง)
- ทุกคำสั่งเขียนให้ **idempotent** เท่าที่ทำได้ (`CREATE ... IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DO $$ ... $$` สำหรับ enum) เพื่อรันซ้ำไม่พัง
