import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Search, History } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatThaiDate, EDU_LEVELS, EDU_LEVEL_LABEL, SCHOOL_TYPE_LABEL, SUBSIDY_TYPE_LABEL, SUBSIDY_TYPES, isVocational } from "@/lib/labels";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";

export const Route = createFileRoute("/_authenticated/children")({ component: ChildrenPage });

const emptyForm = { guardian_id: "", child_name: "", birth_date: "", study_place: "", education_level: "", school_type: "government", subsidy_type: "none", program_group_id: "", is_active: true };

function ChildrenPage() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [histFor, setHistFor] = useState<any>(null);

  const { data: guardians = [] } = useQuery({ queryKey: ["guardians-list"], queryFn: async () => (await supabase.from("guardians").select("id, prefix, first_name, last_name, employee_code").order("employee_code")).data ?? [] });
  const { data: programGroups = [] } = useQuery({ queryKey: ["program-groups"], queryFn: async () => (await supabase.from("program_groups").select("*").eq("active", true).order("name")).data ?? [] });
  const { data: rows = [] } = useQuery({
    queryKey: ["children"],
    queryFn: async () => (await supabase.from("children").select("*, guardians(prefix, first_name, last_name, employee_code, schools(school_name))").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = rows.filter((r: any) => `${r.child_name} ${r.guardians?.first_name || ""}`.toLowerCase().includes(q.toLowerCase()));

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...emptyForm, ...r, study_place: r.study_place ?? "", education_level: r.education_level ?? "", subsidy_type: r.subsidy_type ?? "none", program_group_id: r.program_group_id ?? "" }); setOpen(true); };

  const save = async () => {
    if (!form.guardian_id) return toast.error("กรุณาเลือกผู้มีสิทธิ");
    const voc = isVocational(form.education_level);
    if (voc && !form.program_group_id) return toast.error("ระดับอาชีวศึกษาต้องเลือกกลุ่มสาขาวิชา");
    const { guardians, ...rest } = form;
    const payload = {
      ...rest,
      education_level: form.education_level || null,
      program_group_id: voc ? form.program_group_id || null : null,
    };
    const res = editing
      ? await supabase.from("children").update(payload).eq("id", editing.id)
      : await supabase.from("children").insert(payload).select("id").single();
    if (res.error) return toast.error("บันทึกไม่สำเร็จ", { description: res.error.message });
    // สร้างรายการประวัติการศึกษาปัจจุบันให้บุตรใหม่ที่มีข้อมูลสถานศึกษา
    if (!editing && payload.study_place) {
      const newId = (res as any).data?.id;
      if (newId) {
        await supabase.from("child_education_history").insert({
          child_id: newId, study_place: payload.study_place, education_level: payload.education_level, school_type: payload.school_type,
          subsidy_type: payload.subsidy_type, program_group_id: payload.program_group_id, is_current: true,
        });
      }
    }
    toast.success("บันทึกสำเร็จ");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["children"] });
  };

  const remove = async (id: string) => {
    if (!confirm("ยืนยันลบรายการนี้?")) return;
    const { error } = await supabase.from("children").delete().eq("id", id);
    if (error) return toast.error("ลบไม่สำเร็จ", { description: error.message });
    toast.success("ลบสำเร็จ");
    qc.invalidateQueries({ queryKey: ["children"] });
  };

  const age = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ฐานข้อมูลบุตรผู้ใช้สิทธิ</h1>
          <p className="text-sm text-muted-foreground">รวม {rows.length} คน • จำกัด 3 คน/ผู้มีสิทธิ • อายุไม่เกิน 25 ปี</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />เพิ่มบุตร</Button>
      </div>

      <Card className="p-4">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="ค้นหาชื่อบุตร/ผู้มีสิทธิ..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>ลำดับ</th>
                <th>ผู้มีสิทธิ (สังกัด)</th>
                <th>ชื่อบุตร</th>
                <th>วันเกิด</th>
                <th>อายุ</th>
                <th>สถานศึกษาที่กำลังศึกษา</th>
                <th>ระดับชั้น</th>
                <th>ประเภท</th>
                <th>สถานะ</th>
                <th style={{ width: 130 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any, i: number) => (
                <tr key={r.id}>
                  <td className="text-center">{i + 1}</td>
                  <td>
                    {r.guardians?.prefix}{r.guardians?.first_name} {r.guardians?.last_name}
                    <div className="text-xs text-muted-foreground">{r.guardians?.schools?.school_name || "-"}</div>
                  </td>
                  <td>{r.child_name}</td>
                  <td>{formatThaiDate(r.birth_date)}</td>
                  <td className="text-center">{age(r.birth_date)} ปี</td>
                  <td>{r.study_place || "-"}</td>
                  <td>{r.education_level ? EDU_LEVEL_LABEL[r.education_level] : "-"}</td>
                  <td>{SCHOOL_TYPE_LABEL[r.school_type] || "-"}</td>
                  <td className="text-center">{r.is_active ? <span className="text-success">กำลังศึกษา</span> : <span className="text-muted-foreground">ไม่ใช้สิทธิ</span>}</td>
                  <td>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" title="ประวัติ/เปลี่ยนสถานศึกษา" onClick={() => setHistFor(r)}><History className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      {role === "admin" && <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={10} className="text-center text-muted-foreground">ไม่พบข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "แก้ไขข้อมูลบุตร" : "เพิ่มข้อมูลบุตร"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>ผู้มีสิทธิ *</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3" value={form.guardian_id} onChange={(e) => setForm({ ...form, guardian_id: e.target.value })}>
                <option value="">-- เลือก --</option>
                {guardians.map((g: any) => <option key={g.id} value={g.id}>{g.employee_code} — {g.prefix}{g.first_name} {g.last_name}</option>)}
              </select>
            </div>
            <div><Label>ชื่อบุตร *</Label><Input value={form.child_name} onChange={(e) => setForm({ ...form, child_name: e.target.value })} /></div>
            <div><Label>วันเดือนปีเกิด *</Label><ThaiDatePicker value={form.birth_date} onChange={(v) => setForm({ ...form, birth_date: v })} placeholder="เลือกวันเกิด" /></div>
            <div><Label>สถานศึกษา/มหาวิทยาลัยที่บุตรกำลังศึกษา</Label><Input placeholder="เช่น มหาวิทยาลัยเชียงใหม่ / โรงเรียนสุโขทัยวิทยาคม" value={form.study_place} onChange={(e) => setForm({ ...form, study_place: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ระดับชั้นที่กำลังศึกษา</Label>
                <Select value={form.education_level} onValueChange={(v) => setForm({ ...form, education_level: v, program_group_id: isVocational(v) ? form.program_group_id : "" })}>
                  <SelectTrigger><SelectValue placeholder="-- เลือก --" /></SelectTrigger>
                  <SelectContent>{EDU_LEVELS.map((lv) => <SelectItem key={lv} value={lv}>{EDU_LEVEL_LABEL[lv]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>ประเภทสถานศึกษา</Label>
                <Select value={form.school_type} onValueChange={(v) => setForm({ ...form, school_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SCHOOL_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>เงินอุดหนุน</Label>
                <Select value={form.subsidy_type} onValueChange={(v) => setForm({ ...form, subsidy_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBSIDY_TYPES.map((k) => <SelectItem key={k} value={k}>{SUBSIDY_TYPE_LABEL[k]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {isVocational(form.education_level) && (
                <div>
                  <Label>กลุ่มสาขาวิชา *</Label>
                  <Select value={form.program_group_id} onValueChange={(v) => setForm({ ...form, program_group_id: v })}>
                    <SelectTrigger><SelectValue placeholder="-- เลือก --" /></SelectTrigger>
                    <SelectContent>{programGroups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {editing && <p className="text-xs text-muted-foreground">หากบุตรเปลี่ยนสถานศึกษา/ระดับชั้น กรุณาใช้ปุ่ม "ประวัติ/เปลี่ยนสถานศึกษา" เพื่อเก็บประวัติย้อนหลัง</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={save}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {histFor && <EducationHistoryDialog child={histFor} onClose={() => setHistFor(null)} />}
    </div>
  );
}

function EducationHistoryDialog({ child, onClose }: { child: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [studyPlace, setStudyPlace] = useState("");
  const [level, setLevel] = useState("");
  const [schoolType, setSchoolType] = useState("government");
  const [academicYear, setAcademicYear] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: history = [] } = useQuery({
    queryKey: ["education-history", child.id],
    queryFn: async () => (await supabase.from("child_education_history").select("*").eq("child_id", child.id).order("start_date", { ascending: false })).data ?? [],
  });

  const submit = async () => {
    if (!studyPlace.trim()) return toast.error("กรุณากรอกสถานศึกษา");
    const { error } = await supabase.from("child_education_history").insert({
      child_id: child.id, study_place: studyPlace.trim(), education_level: (level || null) as any, school_type: schoolType as any,
      academic_year: academicYear ? Number(academicYear) : null, start_date: startDate, is_current: true,
    });
    if (error) return toast.error("บันทึกไม่สำเร็จ", { description: error.message });
    const { error: e2 } = await supabase.from("children").update({ study_place: studyPlace.trim(), education_level: (level || null) as any, school_type: schoolType as any }).eq("id", child.id);
    if (e2) return toast.error("อัปเดตข้อมูลปัจจุบันไม่สำเร็จ", { description: e2.message });
    toast.success("บันทึกการเปลี่ยนสถานศึกษาสำเร็จ");
    setAdding(false); setStudyPlace(""); setLevel(""); setSchoolType("government"); setAcademicYear("");
    qc.invalidateQueries({ queryKey: ["education-history", child.id] });
    qc.invalidateQueries({ queryKey: ["children"] });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>ประวัติการศึกษา — {child.child_name}</DialogTitle></DialogHeader>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {history.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีประวัติ</p>}
          {history.map((h: any) => (
            <div key={h.id} className="flex items-start justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{h.study_place}</div>
                <div className="text-muted-foreground">{h.education_level ? EDU_LEVEL_LABEL[h.education_level] : "-"} • {SCHOOL_TYPE_LABEL[h.school_type] || "-"}{h.academic_year ? ` • ปีการศึกษา ${h.academic_year}` : ""}</div>
                <div className="text-xs text-muted-foreground">{formatThaiDate(h.start_date)} – {h.end_date ? formatThaiDate(h.end_date) : "ปัจจุบัน"}</div>
              </div>
              {h.is_current && <span className="rounded bg-success/15 px-2 py-0.5 text-xs text-success">ปัจจุบัน</span>}
            </div>
          ))}
        </div>

        {adding ? (
          <div className="space-y-3 border-t pt-3">
            <div><Label>สถานศึกษา/มหาวิทยาลัยใหม่ *</Label><Input placeholder="เช่น มหาวิทยาลัยเชียงใหม่" value={studyPlace} onChange={(e) => setStudyPlace(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ระดับชั้น</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue placeholder="-- เลือก --" /></SelectTrigger>
                  <SelectContent>{EDU_LEVELS.map((lv) => <SelectItem key={lv} value={lv}>{EDU_LEVEL_LABEL[lv]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>ประเภทสถานศึกษา</Label>
                <Select value={schoolType} onValueChange={setSchoolType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SCHOOL_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ปีการศึกษา</Label><Input type="number" placeholder="เช่น 2568" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} /></div>
              <div><Label>วันที่มีผล</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdding(false)}>ยกเลิก</Button>
              <Button onClick={submit}>บันทึกการเปลี่ยน</Button>
            </div>
          </div>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>ปิด</Button>
            <Button onClick={() => setAdding(true)}><Plus className="mr-2 h-4 w-4" />เปลี่ยนสถานศึกษา</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
