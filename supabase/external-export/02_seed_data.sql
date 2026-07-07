-- =============================================================================
-- ไฟล์ที่ 2 : ข้อมูลจริง (seed) — รันหลัง 01_schema.sql
-- หมายเหตุ: reimbursements.created_by ถูกตั้งเป็น NULL เพราะผูกกับ auth.users
-- ของโปรเจกต์เดิม (ผู้ใช้ต้องสมัครใหม่บน Supabase ภายนอก)
-- ปลอดภัยต่อการรันซ้ำด้วย ON CONFLICT (id) DO NOTHING
-- =============================================================================

-- schools (27 rows)
INSERT INTO public.schools (id, school_code, school_name, school_type, province, created_at, updated_at) VALUES
  ('d0ec6eb7-d336-4346-bd54-c0d536e71423', '1064510002', 'โรงเรียนอุดมดรุณี', 'government', 'สุโขทัย', '2026-05-25T08:36:27.724171+00:00', '2026-05-25T08:36:27.724171+00:00'),
  ('de7a6122-fe37-49c9-98dc-54e4c42f7d9e', '1064510003', 'โรงเรียนบ้านสวนวิทยาคม', 'government', 'สุโขทัย', '2026-05-25T08:36:27.724171+00:00', '2026-05-25T08:36:27.724171+00:00'),
  ('6fe18369-8744-43d1-8534-9d1fa80e25c5', '1064510004', 'โรงเรียนคีรีมาศพิทยาคม', 'government', 'สุโขทัย', '2026-05-25T08:36:27.724171+00:00', '2026-05-25T08:36:27.724171+00:00'),
  ('b49f9d83-00c6-4324-921d-5d9bbf1085a2', '1064510005', 'โรงเรียนศรีสำโรงชนูปถัมภ์', 'government', 'สุโขทัย', '2026-05-25T08:36:27.724171+00:00', '2026-05-25T08:36:27.724171+00:00'),
  ('233656e0-9007-40bb-b588-4d2c9cb6ae80', '1064510001', 'โรงเรียนบ้านด่านลานหอยวิทยา', 'government', 'สุโขทัย', '2026-05-25T08:36:27.724171+00:00', '2026-05-25T09:27:37.167412+00:00'),
  ('2aa65c4b-fb49-4608-a64d-21e1875c6dd6', 'S001', 'โรงเรียนสุโขทัยวิทยาคม', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('9c4b0073-df5d-4748-b757-d246c70a1689', 'S002', 'โรงเรียนยางซ้ายพิทยาคม', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('bcf37929-dabd-4ac3-8562-abcafabb3bbb', 'S003', 'โรงเรียนลิไทพิทยาคม', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('23d716bd-91bb-4106-93e1-53ead441c9aa', 'S004', 'โรงเรียนกงไกรลาศวิทยา', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('9f313e65-0223-4ebe-a087-5c9fe96cf79b', 'S005', 'โรงเรียนหนองตูมวิทยา', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('8c447754-ea75-4907-a334-13649fb45f63', 'S006', 'โรงเรียนไกรในวิทยาคม รัชมังคลาภิเษก', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('bedbde02-77ce-49d4-8f09-922c87ff7833', 'S007', 'โรงเรียนตลิ่งชันวิทยานุสรณ์', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('b044feb9-df47-43fa-8dd6-73c2d749ae32', 'S008', 'โรงเรียนบ้านใหม่เจริญผลพิทยาคม', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('24b0870e-48f8-413c-9b6e-6fa8a4625655', 'S009', 'โรงเรียนชัยมงคลพิทยา', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('9f7aae5e-dd2c-4206-a23e-f3a899e0ac88', 'S010', 'โรงเรียนศรีนคร', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('c86ca9f3-0941-4c7d-b8f0-7bc8b22b7c79', 'S011', 'โรงเรียนท่าชัยวิทยา', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('26a6dc52-e045-472a-8b6c-110837742b8c', 'S012', 'โรงเรียนบ้านแก่งวิทยา', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('b161ed86-cd0c-41cd-a284-e2e59e389cbd', 'S013', 'โรงเรียนเมืองด้งวิทยา', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('a7635719-c3ae-420e-845d-5b6d5e9338c8', 'S014', 'โรงเรียนบ้านไร่พิทยาคม', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('9c30a386-0fba-4cb5-8769-37aabf525c96', 'S015', 'โรงเรียนวังทองวิทยา', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('7bd5f1e0-833d-463f-8f06-1ea15d7ee973', 'S016', 'โรงเรียนขุนไกรพิทยาคม', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('dd5edd7e-1701-429e-a153-d905387d9364', 'S017', 'โรงเรียนสวรรค์อนันต์วิทยา', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('11b0aafc-055d-4fbc-b50a-cca293e76c27', 'S018', 'โรงเรียนหนองปลาหมอวิทยาคม', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('df72ff1a-742a-45b6-9d3c-d7bc0ac0005f', 'S019', 'โรงเรียนหนองกลับวิทยาคม', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('6338e2dc-c3da-4b5e-9edf-5000cd2787bb', 'S020', 'โรงเรียนสวรรค์อนันต์วิทยา 2', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('130c551a-e039-4013-9d7d-5a07f025f8ba', 'S021', 'โรงเรียนทุ่งเสลี่ยมชนูปถัมภ์', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00'),
  ('a6c55ca1-f9eb-495d-a7db-fc962349a444', 'S022', 'โรงเรียนเมืองเชลียง', 'government', 'สุโขทัย', '2026-06-07T00:51:19.56314+00:00', '2026-06-07T00:51:19.56314+00:00')
ON CONFLICT (id) DO NOTHING;

-- program_groups (10 rows)
INSERT INTO public.program_groups (id, code, name, active, level, created_at, updated_at) VALUES
  ('f5dc66bd-9377-4447-8323-fe59369127b2', 'business_administration', 'พาณิชยกรรม', true, 'vocational_certificate', '2026-06-08T07:36:28.700897+00:00', '2026-06-10T06:33:52.029881+00:00'),
  ('f1c8e679-9f32-4f3c-820f-b2bd4a8bb8be', 'industrial', 'ช่างอุตสาหกรรม', true, 'vocational_certificate', '2026-06-08T07:36:28.700897+00:00', '2026-06-10T06:33:52.029881+00:00'),
  ('3619017d-fd5e-4ec9-a584-471a5d2a9a2d', 'agriculture', 'เกษตรกรรม', true, 'vocational_certificate', '2026-06-08T07:36:28.700897+00:00', '2026-06-10T06:33:52.029881+00:00'),
  ('7c290a60-70bd-4f83-aa96-e5e2bf1c5ad9', 'tourism', 'ท่องเที่ยว', true, 'vocational_certificate', '2026-06-08T07:36:28.700897+00:00', '2026-06-10T06:33:52.029881+00:00'),
  ('71011806-dcea-4f9d-8c70-c96eb9a55b75', 'home_economics', 'คหกรรม', true, 'vocational_certificate', '2026-06-08T07:36:28.700897+00:00', '2026-06-10T06:33:52.029881+00:00'),
  ('70a24527-ad51-489a-a200-f504bb961b71', 'fisheries', 'ประมง', true, 'vocational_certificate', '2026-06-08T07:36:28.700897+00:00', '2026-06-10T06:33:52.029881+00:00'),
  ('ecc5610e-5340-4d36-8080-d8e72d9fde83', 'fine_arts', 'ศิลปกรรม', true, 'vocational_certificate', '2026-06-08T07:36:28.700897+00:00', '2026-06-10T06:33:52.029881+00:00'),
  ('8785cc0f-efa1-4a86-9aa2-a91f8671d431', 'textile', 'สิ่งทอ', true, 'vocational_certificate', '2026-06-08T07:36:28.700897+00:00', '2026-06-10T06:33:52.029881+00:00'),
  ('5814693d-2421-4224-a7e4-fa082a0a6cb0', 'voc_hi_group1', 'กลุ่มที่ 1 (ช่างอุตสาหกรรม/เทคโนโลยีสารสนเทศและการสื่อสาร/ทัศนศาสตร์)', true, 'higher_vocational', '2026-06-10T06:33:52.029881+00:00', '2026-06-10T06:33:52.029881+00:00'),
  ('29456756-c172-437e-9f7e-5f6db6ea32f2', 'voc_hi_group2', 'กลุ่มที่ 2 (พาณิชยกรรม/บริหารธุรกิจ/ศิลปกรรม/เกษตรกรรม/คหกรรม/ท่องเที่ยว)', true, 'higher_vocational', '2026-06-10T06:33:52.029881+00:00', '2026-06-10T06:33:52.029881+00:00')
ON CONFLICT (id) DO NOTHING;

-- guardians (3 rows)
INSERT INTO public.guardians (id, employee_code, prefix, first_name, last_name, national_id, school_id, phone, position, created_at, updated_at) VALUES
  ('ecc77b85-2021-4e85-8514-7421b923d78c', '', 'นาง', 'กินรี', 'พุ่มพวง', '-', '233656e0-9007-40bb-b588-4d2c9cb6ae80', '-', '-', '2026-05-25T09:27:58.203137+00:00', '2026-06-04T03:47:53.036935+00:00'),
  ('7f437c2b-acef-4de8-b21a-83bb25cc3000', '1', 'นาย', 'สมชาย', 'สบายใจ', '', 'b49f9d83-00c6-4324-921d-5d9bbf1085a2', '-', '-', '2026-06-04T03:52:04.554203+00:00', '2026-06-04T03:52:04.554203+00:00'),
  ('c21ad89f-7f4f-40f4-b05c-984199f96f7d', '2', 'นาย', 'กนกภัณฑ์', 'สังคภัณฑ์', '1234567890000', '233656e0-9007-40bb-b588-4d2c9cb6ae80', '', '', '2026-07-01T15:15:33.677252+00:00', '2026-07-01T15:15:33.677252+00:00')
ON CONFLICT (id) DO NOTHING;

-- children (5 rows)
INSERT INTO public.children (id, guardian_id, child_name, birth_date, is_active, study_place, education_level, school_type, subsidy_type, program_group_id, created_at, updated_at) VALUES
  ('0d6bdc91-101c-40ee-856b-c6217b57fc41', 'ecc77b85-2021-4e85-8514-7421b923d78c', 'ดช.ปพณธีร์ พุ่มพวง', '2005-02-11', true, 'มหาวิทยาลัยขอนแก่น', 'bachelor', 'government', 'none', NULL, '2026-05-25T09:28:35.939766+00:00', '2026-06-04T03:49:11.06251+00:00'),
  ('05936919-eba0-4fac-97d6-5d6ad86e9e42', '7f437c2b-acef-4de8-b21a-83bb25cc3000', 'ดญ.สมหญิง สบายใจ', '2011-01-01', true, 'อนุบาลสุโขทัย', 'primary', 'government', 'none', NULL, '2026-06-04T03:52:46.85246+00:00', '2026-06-07T00:28:45.149445+00:00'),
  ('65624659-f8eb-4c16-b597-89d9f27ff910', '7f437c2b-acef-4de8-b21a-83bb25cc3000', 'นายสมชายชาตรี สบายใจ', '2002-01-01', true, 'มหาวิทยาลัยนเรศวร', 'bachelor', 'government', 'none', NULL, '2026-06-10T06:58:19.328822+00:00', '2026-07-01T14:35:09.171553+00:00'),
  ('fc539364-ff90-4f59-a79b-25a30f037e34', 'c21ad89f-7f4f-40f4-b05c-984199f96f7d', 'นายเอ สมควร', '2006-01-18', true, 'โรงเรียนคอเวนชั่น', 'vocational_certificate', 'private', 'subsidized', 'f5dc66bd-9377-4447-8323-fe59369127b2', '2026-07-01T15:35:03.988405+00:00', '2026-07-01T15:35:03.988405+00:00'),
  ('251c4b53-0b3b-4e27-9d85-0aa05fd28ead', 'c21ad89f-7f4f-40f4-b05c-984199f96f7d', 'นางสาววิเศษสุด สังคภัณฑ์', '2008-09-11', true, 'วิทยาลัยนโปเลียน', 'higher_vocational', 'private', 'none', '5814693d-2421-4224-a7e4-fa082a0a6cb0', '2026-07-04T12:57:06.181165+00:00', '2026-07-04T13:04:05.859494+00:00')
ON CONFLICT (id) DO NOTHING;

-- guardian_affiliation_history (1 rows)
INSERT INTO public.guardian_affiliation_history (id, guardian_id, school_id, position, note, start_date, end_date, is_current, created_at, updated_at) VALUES
  ('915251fb-dcf4-4202-9d66-fd4cbabb6b91', 'ecc77b85-2021-4e85-8514-7421b923d78c', '233656e0-9007-40bb-b588-4d2c9cb6ae80', '-', NULL, '2026-06-03', NULL, true, '2026-06-03T17:37:10.104641+00:00', '2026-06-03T17:37:10.104641+00:00')
ON CONFLICT (id) DO NOTHING;

-- child_education_history (6 rows)
INSERT INTO public.child_education_history (id, child_id, study_place, education_level, school_type, academic_year, subsidy_type, program_group_id, start_date, end_date, is_current, created_at, updated_at) VALUES
  ('0687431a-9f5e-4713-8566-75822f44ea19', '0d6bdc91-101c-40ee-856b-c6217b57fc41', 'มหาวิทยาลัยขอนแก่น', NULL, 'government', NULL, 'none', NULL, '2026-06-03', NULL, true, '2026-06-03T17:42:14.042026+00:00', '2026-06-03T17:42:14.042026+00:00'),
  ('25d1cba7-0237-42b7-a81b-92583873a681', '0d6bdc91-101c-40ee-856b-c6217b57fc41', 'มหาวิทยาลัยนอร์ทเชียงใหม่', 'bachelor', 'private', NULL, 'none', NULL, '2026-06-03', '2026-06-03', false, '2026-06-03T17:37:10.104641+00:00', '2026-06-03T17:42:14.042026+00:00'),
  ('8014d7e5-3942-4d03-9ffe-d937fee95bea', '05936919-eba0-4fac-97d6-5d6ad86e9e42', 'อนุบาลสุโขทัย', 'kindergarten', 'private', NULL, 'none', NULL, '2026-06-04', NULL, true, '2026-06-04T03:52:47.058111+00:00', '2026-06-04T03:52:47.058111+00:00'),
  ('f9514a4e-7cc1-4524-8e92-2a3cb6ae62db', '65624659-f8eb-4c16-b597-89d9f27ff910', 'มหาวิทยาลัยฟาสอีสเอเชีย', 'bachelor', 'private', NULL, 'non_subsidized', NULL, '2026-06-10', NULL, true, '2026-06-10T06:58:19.545846+00:00', '2026-06-10T06:58:19.545846+00:00'),
  ('dd154c3c-3563-4cc9-b10c-ae0bb8ea5d27', 'fc539364-ff90-4f59-a79b-25a30f037e34', 'โรงเรียนคอเวนชั่น', 'vocational_certificate', 'private', NULL, 'subsidized', 'f5dc66bd-9377-4447-8323-fe59369127b2', '2026-07-01', NULL, true, '2026-07-01T15:35:04.310219+00:00', '2026-07-01T15:35:04.310219+00:00'),
  ('3d44523f-d31c-4aea-977f-5f31f50ed057', '251c4b53-0b3b-4e27-9d85-0aa05fd28ead', 'วิทยาลัยนโปเลียน', 'vocational_certificate', 'private', NULL, 'non_subsidized', 'f5dc66bd-9377-4447-8323-fe59369127b2', '2026-07-04', NULL, true, '2026-07-04T12:57:06.390454+00:00', '2026-07-04T12:57:06.390454+00:00')
ON CONFLICT (id) DO NOTHING;

-- reimbursement_rates (33 rows)
INSERT INTO public.reimbursement_rates (id, school_type, education_level, max_amount, academic_year, subsidy_type, program_group_id, reimbursement_type, reimbursement_percent, created_at) VALUES
  ('6552eb96-0b94-44c2-a387-ed601bc1a8f5', 'government', 'kindergarten', 5800.0, 2569, 'none', NULL, 'fixed_amount', NULL, '2026-05-25T08:36:27.724171+00:00'),
  ('3d763cbc-127b-4f8b-afa7-365f7ea70426', 'government', 'primary', 4000.0, 2569, 'none', NULL, 'fixed_amount', NULL, '2026-05-25T08:36:27.724171+00:00'),
  ('7a423724-3be8-401d-91d1-da40a88b125a', 'private', 'vocational_certificate', 24400.0, 2569, 'non_subsidized', '8785cc0f-efa1-4a86-9aa2-a91f8671d431', 'fixed_amount', NULL, '2026-07-03T03:48:17.415283+00:00'),
  ('7e872aec-cca1-4bf2-9f46-7beed09188f5', 'government', 'lower_secondary', 4800.0, 2569, 'none', NULL, 'fixed_amount', NULL, '2026-05-25T08:36:27.724171+00:00'),
  ('3f68bcdc-2242-4eb3-9542-c0bf79deb26f', 'private', 'higher_vocational', 25000.0, 2569, 'none', '29456756-c172-437e-9f7e-5f6db6ea32f2', 'half_of_actual', NULL, '2026-07-03T03:32:49.00438+00:00'),
  ('70212325-9163-4bbc-bb3e-a3beaef7607c', 'private', 'kindergarten', 13600.0, 2569, 'non_subsidized', NULL, 'fixed_amount', NULL, '2026-05-25T08:36:27.724171+00:00'),
  ('b11d3542-98ac-400b-8fd9-56fa755cd708', 'private', 'primary', 13200.0, 2569, 'non_subsidized', NULL, 'fixed_amount', NULL, '2026-05-25T08:36:27.724171+00:00'),
  ('492968f4-e7e5-4039-aec4-9aae865b20fd', 'private', 'lower_secondary', 15800.0, 2569, 'non_subsidized', NULL, 'fixed_amount', NULL, '2026-05-25T08:36:27.724171+00:00'),
  ('f10c087e-a3e5-49d6-8d4e-ddcace5a7eec', 'private', 'upper_secondary', 16200.0, 2569, 'non_subsidized', NULL, 'fixed_amount', NULL, '2026-05-25T08:36:27.724171+00:00'),
  ('e74bb268-c781-4b4b-960e-97de20585f00', 'private', 'vocational_certificate', 16500.0, 2569, 'non_subsidized', '71011806-dcea-4f9d-8c70-c96eb9a55b75', 'fixed_amount', NULL, '2026-07-02T11:53:22.258121+00:00'),
  ('731910e6-e55d-48c3-83a2-c5b5ea9a3b02', 'government', 'vocational_certificate', 4800.0, 2569, 'none', NULL, 'fixed_amount', NULL, '2026-07-03T03:24:37.311485+00:00'),
  ('e06ed497-a2d3-4c9e-aea7-9adc9ba3fc91', 'government', 'higher_vocational', 13700.0, 2569, 'none', NULL, 'fixed_amount', NULL, '2026-07-03T03:24:49.716228+00:00'),
  ('df4424d4-3231-4efb-a37a-ea53c6aecc24', 'government', 'bachelor', 25000.0, 2569, 'none', NULL, 'fixed_amount', NULL, '2026-07-03T03:25:52.085136+00:00'),
  ('e6cfc471-123d-4473-a120-58f8afff87e5', 'private', 'kindergarten', 4800.0, 2569, 'subsidized', NULL, 'fixed_amount', NULL, '2026-07-03T03:26:54.380482+00:00'),
  ('8831f78b-96f3-4ec8-81fb-135daa5571cf', 'private', 'primary', 4200.0, 2569, 'subsidized', NULL, 'fixed_amount', NULL, '2026-07-03T03:27:37.731533+00:00'),
  ('a96993a0-c903-4388-90fe-58c6d63eb0b7', 'private', 'lower_secondary', 3300.0, 2569, 'subsidized', NULL, 'fixed_amount', NULL, '2026-07-03T03:27:58.271493+00:00'),
  ('77048484-acbc-47ff-a139-6a3e8b6dae94', 'private', 'upper_secondary', 3200.0, 2569, 'subsidized', NULL, 'fixed_amount', NULL, '2026-07-03T03:28:12.777249+00:00'),
  ('eb9cfea3-5853-4910-98e5-f8682505cb6b', 'private', 'vocational_certificate', 3400.0, 2569, 'subsidized', '71011806-dcea-4f9d-8c70-c96eb9a55b75', 'fixed_amount', NULL, '2026-07-03T03:28:56.574692+00:00'),
  ('954c2cec-1090-428c-a03e-26f838f88fb1', 'private', 'vocational_certificate', 5100.0, 2569, 'subsidized', 'f5dc66bd-9377-4447-8323-fe59369127b2', 'fixed_amount', NULL, '2026-07-03T03:29:16.416337+00:00'),
  ('e61646bb-2109-48a0-8d85-0510822065de', 'private', 'vocational_certificate', 3600.0, 2569, 'subsidized', 'ecc5610e-5340-4d36-8080-d8e72d9fde83', 'fixed_amount', NULL, '2026-07-03T03:29:35.581138+00:00'),
  ('f7b27add-f2b2-4032-83a9-f52dbaf1538d', 'private', 'vocational_certificate', 5000.0, 2569, 'subsidized', '3619017d-fd5e-4ec9-a584-471a5d2a9a2d', 'fixed_amount', NULL, '2026-07-03T03:29:49.774995+00:00'),
  ('222d26ab-599a-4750-b6de-599d0a96c1b8', 'private', 'vocational_certificate', 7200.0, 2569, 'subsidized', 'f1c8e679-9f32-4f3c-820f-b2bd4a8bb8be', 'fixed_amount', NULL, '2026-07-03T03:30:13.983723+00:00'),
  ('ae881f04-8b5f-4696-962d-48cbee3c5ecd', 'private', 'vocational_certificate', 5000.0, 2569, 'subsidized', '70a24527-ad51-489a-a200-f504bb961b71', 'fixed_amount', NULL, '2026-07-03T03:30:29.853848+00:00'),
  ('7e72c56e-1b50-488c-a03d-8720e5fdaeac', 'private', 'vocational_certificate', 5100.0, 2569, 'subsidized', '7c290a60-70bd-4f83-aa96-e5e2bf1c5ad9', 'fixed_amount', NULL, '2026-07-03T03:31:08.168422+00:00'),
  ('b4983df0-2403-4a5f-b6b7-ddf12734f90d', 'private', 'vocational_certificate', 7200.0, 2569, 'subsidized', '8785cc0f-efa1-4a86-9aa2-a91f8671d431', 'fixed_amount', NULL, '2026-07-03T03:31:26.695875+00:00'),
  ('24eecdbf-5621-4f0e-ad6b-000fbe0c92e5', 'private', 'vocational_certificate', 19900.0, 2569, 'non_subsidized', 'f5dc66bd-9377-4447-8323-fe59369127b2', 'fixed_amount', NULL, '2026-07-03T03:44:35.06562+00:00'),
  ('a0cdb1c2-aae7-4e2a-829e-ea32b49e549c', 'private', 'vocational_certificate', 20000.0, 2569, 'non_subsidized', 'ecc5610e-5340-4d36-8080-d8e72d9fde83', 'fixed_amount', NULL, '2026-07-03T03:44:56.216901+00:00'),
  ('8c955738-6fb9-4251-843a-280833d313aa', 'private', 'vocational_certificate', 21000.0, 2569, 'non_subsidized', '3619017d-fd5e-4ec9-a584-471a5d2a9a2d', 'fixed_amount', NULL, '2026-07-03T03:45:12.511598+00:00'),
  ('0661c589-3084-4965-ac24-8e2a98e9e931', 'private', 'vocational_certificate', 24400.0, 2569, 'non_subsidized', 'f1c8e679-9f32-4f3c-820f-b2bd4a8bb8be', 'fixed_amount', NULL, '2026-07-03T03:47:15.081877+00:00'),
  ('9beed50b-40f7-4d3b-839e-67bc592577fd', 'private', 'vocational_certificate', 21100.0, 2569, 'non_subsidized', '70a24527-ad51-489a-a200-f504bb961b71', 'fixed_amount', NULL, '2026-07-03T03:47:32.762519+00:00'),
  ('ddd174e1-3a67-4453-94cd-49ed2e1307bc', 'private', 'vocational_certificate', 19900.0, 2569, 'non_subsidized', '7c290a60-70bd-4f83-aa96-e5e2bf1c5ad9', 'fixed_amount', NULL, '2026-07-03T03:47:57.548277+00:00'),
  ('2a407d25-c5a1-4f95-9910-e591d3edef05', 'private', 'bachelor', 25000.0, 2569, 'none', NULL, 'half_of_actual', NULL, '2026-07-04T12:20:06.638357+00:00'),
  ('3d9b33f2-9b16-4f1c-b86f-2cb2caf365f4', 'private', 'higher_vocational', 30000.0, 2569, 'none', '5814693d-2421-4224-a7e4-fa082a0a6cb0', 'half_of_actual', NULL, '2026-07-02T11:55:00.207861+00:00')
ON CONFLICT (id) DO NOTHING;

-- reimbursements (4 rows)
INSERT INTO public.reimbursements (id, academic_year, registration_no, guardian_id, child_id, school_id, education_level, school_type, study_place, subsidy_type, program_group_id, reimbursement_type, reimbursement_percent, entitled_amount, sem1_pay_date, sem1_doc_no, sem1_receipt_no, sem1_receipt_date, sem1_amount, sem2_pay_date, sem2_doc_no, sem2_receipt_no, sem2_receipt_date, sem2_amount, remark, created_by, created_at, updated_at) VALUES
  ('319ea972-538e-4e2a-83d1-54a60813d5f3', 2569, '0002/2569', '7f437c2b-acef-4de8-b21a-83bb25cc3000', '05936919-eba0-4fac-97d6-5d6ad86e9e42', NULL, 'kindergarten', 'government', 'อนุบาลสุโขทัย', 'none', NULL, 'fixed_amount', NULL, 5800.0, '2026-06-06', '3600000000', 'สพรุุุุ333333', '2026-05-31', 5000.0, NULL, '', '', NULL, 0.0, '', NULL, '2026-06-06T03:09:20.532676+00:00', '2026-06-06T03:09:20.532676+00:00'),
  ('50dedb22-bfdf-480a-a8d4-7dda9d43ffb5', 2569, '0001/2569', 'ecc77b85-2021-4e85-8514-7421b923d78c', '0d6bdc91-101c-40ee-856b-c6217b57fc41', NULL, 'bachelor', 'government', 'มหาวิทยาลัยขอนแก่น', 'none', NULL, 'fixed_amount', NULL, 25000.0, '2026-06-04', '36000000', '26 ก264444-36', '2026-04-29', 0.0, NULL, '', '', NULL, 0.0, '', NULL, '2026-06-04T03:50:48.96463+00:00', '2026-06-10T07:06:57.645321+00:00'),
  ('77d491fd-198a-47e3-926b-b54d663b6a46', 2569, '0003/2569', '7f437c2b-acef-4de8-b21a-83bb25cc3000', '65624659-f8eb-4c16-b597-89d9f27ff910', NULL, 'bachelor', 'private', 'มหาวิทยาลัยฟาสอีสเอเชีย', 'non_subsidized', NULL, 'half_of_actual', NULL, 17500.0, '2026-06-10', '3600000012', 'กก123456', '2026-06-01', 0.0, NULL, '', '', NULL, 0.0, '', NULL, '2026-06-10T07:05:54.415711+00:00', '2026-07-04T12:44:46.512292+00:00'),
  ('7e673611-dd99-4eeb-85af-466b47cb9722', 2569, '0004/2569', 'c21ad89f-7f4f-40f4-b05c-984199f96f7d', 'fc539364-ff90-4f59-a79b-25a30f037e34', NULL, 'vocational_certificate', 'private', 'โรงเรียนคอเวนชั่น', 'subsidized', 'f5dc66bd-9377-4447-8323-fe59369127b2', 'fixed_amount', NULL, 5100.0, NULL, '', '', NULL, 0.0, NULL, '', '', NULL, 0.0, '', NULL, '2026-07-04T13:09:42.152934+00:00', '2026-07-04T13:09:42.152934+00:00')
ON CONFLICT (id) DO NOTHING;
