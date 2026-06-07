### เปลี่ยนฟิลด์วันที่ในหน้า /reimbursements ให้ใช้ ThaiDatePicker

#### รายละเอียด
ในหน้าเว็บ `/reimbursements` เมนู "เพิ่มรายการเบิก" (และแก้ไข) มีฟิลด์วันที่ 4 ฟิลด์:
- วันที่จ่ายเงิน ภาคเรียนที่ 1 (sem1_pay_date)
- วันที่ใบเสร็จ ภาคเรียนที่ 1 (sem1_receipt_date)
- วันที่จ่ายเงิน ภาคเรียนที่ 2 (sem2_pay_date)
- วันที่ใบเสร็จ ภาคเรียนที่ 2 (sem2_receipt_date)

ปัจจุบันใช้ `<Input type="date" />` ต้องการเปลี่ยนเป็น `<ThaiDatePicker />` ที่แสดงเดือนภาษาไทยและปี พ.ศ. ( Buddhist Era )

#### วิธีดำเนินการ
1. แก้ไขไฟล์ `src/routes/_authenticated/reimbursements.tsx`
2. เปลี่ยนทั้ง 4 ฟิลด์จาก `<Input type="date" ... />` เป็น `<ThaiDatePicker value={...} onChange={...} />`
3. `ThaiDatePicker` ใช้ value เป็น string ISO (`yyyy-mm-dd`) และ `onChange` คืน string ISO ซึ่งตรงกับโครงสร้าง state ปัจจุบัน ไม่ต้องแก้ไข logic อื่น
4. ตรวจสอบว่า import `ThaiDatePicker` มีอยู่แล้วหรือเพิ่ม import ถ้ายังไม่มี

#### ผลลัพธ์
- ผู้ใช้เลือกวันที่ผ่านปฏิทินที่แสดงเดือน/ปี เป็นภาษาไทย (พ.ศ.)
- ข้อมูลที่บันทึกยังคงเป็น ISO date string ปกติ ไม่กระทบการคำนวณหรือแสดงผลอื่น