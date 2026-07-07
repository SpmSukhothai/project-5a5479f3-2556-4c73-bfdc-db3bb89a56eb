# นำระบบไปติดตั้งบน Supabase ภายนอก

ชุดไฟล์นี้ใช้สร้างฐานข้อมูลของ **ระบบทะเบียนคุมการเบิกเงินค่าการศึกษาบุตร — สพม.สุโขทัย**
บน Supabase project ของคุณเอง (นอก Lovable Cloud) ครบทั้งโครงสร้าง ระบบสิทธิ (admin/finance)
ระบบสมัคร/ล็อกอิน และข้อมูลจริงทั้งหมด

## ไฟล์ในชุดนี้

| ไฟล์ | หน้าที่ |
|------|---------|
| `01_schema.sql` | โครงสร้างตาราง, enum, ฟังก์ชัน, trigger, สิทธิ (GRANT), RLS และระบบ Auth (คนแรกที่สมัคร = admin) |
| `02_seed_data.sql` | ข้อมูลจริงทุกตาราง (โรงเรียน, ผู้มีสิทธิ, บุตร, อัตราการเบิก, รายการเบิก ฯลฯ) |

---

## ขั้นตอนการติดตั้ง

### 1. สร้าง Supabase project ใหม่
1. ไปที่ https://supabase.com → **New project**
2. ตั้งชื่อ, รหัสผ่านฐานข้อมูล, เลือก region แล้วสร้าง
3. รอจน project พร้อมใช้งาน

### 2. รันไฟล์ SQL
1. เปิด **SQL Editor** ใน Supabase dashboard
2. คัดลอกเนื้อหา `01_schema.sql` ทั้งไฟล์ → วาง → **Run**
3. คัดลอกเนื้อหา `02_seed_data.sql` ทั้งไฟล์ → วาง → **Run**

> ทั้งสองไฟล์ออกแบบให้รันซ้ำได้ (idempotent) — หากรันซ้ำจะไม่พังและไม่เกิดข้อมูลซ้ำ

### 3. เปิดระบบล็อกอิน (Authentication)
1. ไปที่ **Authentication → Providers**
2. เปิด **Email** (จำเป็น)
3. หากต้องการล็อกอินด้วย Google ให้เปิด **Google** และกรอก Client ID/Secret ตามคู่มือ Supabase
4. (แนะนำ) **Authentication → Providers → Email** ปิด "Confirm email" หากต้องการให้ล็อกอินได้ทันทีหลังสมัคร

### 4. สร้างผู้ใช้คนแรก (จะได้สิทธิ admin อัตโนมัติ)
- เปิดแอป → หน้า **สมัครสมาชิก** → สมัครด้วยอีเมลของผู้ดูแลระบบ
- ผู้สมัคร **คนแรก** จะได้สิทธิ **admin** โดยอัตโนมัติ (ผ่าน trigger `on_auth_user_created`)
- ผู้สมัครคนถัดไปจะได้สิทธิ **finance** โดยอัตโนมัติ

---

## การเชื่อมต่อแอปกับ Supabase ภายนอก

ค่าที่ต้องเปลี่ยน (เอามาจาก **Project Settings → API** ของ Supabase project ใหม่):

**ฝั่ง client (Vite):**
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon public key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

**ฝั่ง server:**
```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role secret key>
```

> ⚠️ **ข้อควรทราบ:** ขณะนี้แอปรันอยู่บน **Lovable Cloud** ซึ่งจัดการไฟล์ `.env` ให้อัตโนมัติ
> และอาจถูกเขียนทับ การชี้แอปไปยัง Supabase ภายนอกจริง ๆ แนะนำให้ทำตอน **นำโค้ดไป self-host / deploy เอง**
> (เช่น export โปรเจกต์แล้ว deploy บนเซิร์ฟเวอร์ของคุณ) แล้วตั้งค่า environment variables ข้างต้น

---

## ข้อจำกัดเรื่องข้อมูลผู้ใช้ (สำคัญ)

ตาราง `profiles`, `user_roles` และคอลัมน์ `reimbursements.created_by` ผูกกับ `auth.users`
ซึ่ง **ส่งออก/ย้ายด้วย SQL ไม่ได้** (รหัสผ่านถูกเข้ารหัส และ user id จะไม่ตรงกันข้ามโปรเจกต์)
ดังนั้น:

- **ไม่มีการ seed** `profiles` / `user_roles` — ผู้ใช้ทุกคนต้อง **สมัครใหม่** บน Supabase ภายนอก
- `reimbursements.created_by` ถูกตั้งเป็น `NULL` (ข้อมูลรายการเบิกอื่น ๆ ครบถ้วน)

### วิธีปรับสิทธิผู้ใช้ (หลังผู้ใช้สมัครแล้ว)
ให้ **admin** เข้าไปที่หน้า **ตั้งค่า (Settings)** ของแอปเพื่อกำหนดสิทธิ admin/finance ให้ผู้ใช้อื่น
หรือรันคำสั่งนี้ใน SQL Editor:

```sql
-- ดู user id จากอีเมล
SELECT id, email FROM auth.users;

-- ให้สิทธิ finance
INSERT INTO public.user_roles (user_id, role)
VALUES ('<user-id>', 'finance')
ON CONFLICT (user_id, role) DO NOTHING;

-- ให้สิทธิ admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('<user-id>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## สรุประบบสิทธิ

| สิทธิ | ทำอะไรได้ |
|-------|-----------|
| **admin** | จัดการทุกอย่าง: โรงเรียน, อัตราการเบิก, กลุ่มสาขา, สิทธิผู้ใช้, ลบข้อมูล และดู audit log |
| **finance** | บันทึก/แก้ไข ผู้มีสิทธิ, บุตร, รายการเบิก และประวัติต่าง ๆ (ลบไม่ได้) |

ทุกตารางเปิด **Row Level Security** และเข้าถึงได้เฉพาะผู้ใช้ที่ล็อกอินและมีสิทธิเท่านั้น
