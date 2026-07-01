CREATE OR REPLACE FUNCTION public.validate_program_group()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.education_level::text IN ('vocational_certificate', 'higher_vocational')
     AND NEW.school_type::text = 'private' THEN
    IF NEW.program_group_id IS NULL THEN
      RAISE EXCEPTION 'ระดับอาชีวศึกษาเอกชน (ปวช./ปวส.) ต้องระบุกลุ่มสาขาวิชา';
    END IF;
  ELSE
    NEW.program_group_id := NULL;
  END IF;
  RETURN NEW;
END;
$function$;