-- เพิ่มคอลัมน์ระดับชั้นเพื่อผูกกลุ่มสาขากับ ปวช./ปวส.
ALTER TABLE public.program_groups ADD COLUMN IF NOT EXISTS level text;

-- กลุ่มสาขาเดิม 8 รายการเป็นของ ปวช.
UPDATE public.program_groups SET level = 'vocational_certificate' WHERE level IS NULL;

-- เพิ่ม 2 กลุ่มสาขาสำหรับ ปวส.
INSERT INTO public.program_groups (code, name, level, active)
VALUES
  ('voc_hi_group1', 'กลุ่มที่ 1 (ช่างอุตสาหกรรม/เทคโนโลยีสารสนเทศและการสื่อสาร/ทัศนศาสตร์)', 'higher_vocational', true),
  ('voc_hi_group2', 'กลุ่มที่ 2 (พาณิชยกรรม/บริหารธุรกิจ/ศิลปกรรม/เกษตรกรรม/คหกรรม/ท่องเที่ยว)', 'higher_vocational', true)
ON CONFLICT (code) DO NOTHING;