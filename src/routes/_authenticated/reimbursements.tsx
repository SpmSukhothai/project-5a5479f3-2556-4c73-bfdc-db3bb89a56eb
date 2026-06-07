import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Printer, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { EDU_LEVEL_LABEL, EDU_LEVELS, SCHOOL_TYPE_LABEL, formatTHB, formatThaiDate, ORG_NAME } from "@/lib/labels";
import { useAuth } from "@/hooks/use-auth";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";

export const Route = createFileRoute("/_authenticated/reimbursements")({ component: ReimbPage });

type Form = {
  id?: string;
  academic_year: number;
  guardian_id: string;
  child_id: string;
  study_place: string;
  education_level: typeof EDU_LEVELS[number];
  school_type: "government" | "private";
  entitled_amount: number;
  sem1_pay_date: string; sem1_doc_no: string; sem1_receipt_no: string; sem1_receipt_date: string; sem1_amount: number;
  sem2_pay_date: string; sem2_doc_no: string; sem2_receipt_no: string; sem2_receipt_date: string; sem2_amount: number;
  remark: string;
};

const emptyForm: Form = {
  academic_year: 2569, guardian_id: "", child_id: "", study_place: "",
  education_level: "primary", school_type: "government", entitled_amount: 0,
  sem1_pay_date: "", sem1_doc_no: "", sem1_receipt_no: "", sem1_receipt_date: "", sem1_amount: 0,
  sem2_pay_date: "", sem2_doc_no: "", sem2_receipt_no: "", sem2_receipt_date: "", sem2_amount: 0,
  remark: "",
};

function ReimbPage() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [year, setYear] = useState(2569);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const { data: rows = [] } = useQuery({
    queryKey: ["reimb", year],
    queryFn: async () => (await supabase.from("reimbursements")
      .select("*, guardians(prefix,first_name,last_name), children(child_name)")
      .eq("academic_year", year).order("registration_no")).data ?? [],
  });
  const { data: guardians = [] } = useQuery({ queryKey: ["g-list"], queryFn: async () => (await supabase.from("guardians").select("id, prefix, first_name, last_name, employee_code").order("employee_code")).data ?? [] });
  const { data: children = [] } = useQuery({ queryKey: ["c-list"], queryFn: async () => (await supabase.from("children").select("id, child_name, guardian_id, study_place, education_level, school_type").order("child_name")).data ?? [] });
  const { data: eduHistory = [] } = useQuery({ queryKey: ["edu-current"], queryFn: async () => (await supabase.from("child_education_history").select("child_id, study_place, education_level, school_type").eq("is_current", true)).data ?? [] });
  const { data: rates = [] } = useQuery({ queryKey: ["rates"], queryFn: async () => (await supabase.from("reimbursement_rates").select("*")).data ?? [] });

  const filteredChildren = children.filter((c: any) => !form.guardian_id || c.guardian_id === form.guardian_id);

  const openNew = () => { setEditing(null); setForm({ ...emptyForm, academic_year: year }); setOpen(true); };
  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      academic_year: r.academic_year, guardian_id: r.guardian_id, child_id: r.child_id, study_place: r.study_place || "",
      education_level: r.education_level, school_type: r.school_type, entitled_amount: Number(r.entitled_amount),
      sem1_pay_date: r.sem1_pay_date || "", sem1_doc_no: r.sem1_doc_no || "", sem1_receipt_no: r.sem1_receipt_no || "", sem1_receipt_date: r.sem1_receipt_date || "", sem1_amount: Number(r.sem1_amount),
      sem2_pay_date: r.sem2_pay_date || "", sem2_doc_no: r.sem2_doc_no || "", sem2_receipt_no: r.sem2_receipt_no || "", sem2_receipt_date: r.sem2_receipt_date || "", sem2_amount: Number(r.sem2_amount),
      remark: r.remark || "",
    });
    setOpen(true);
  };

  // auto-fill study place / level / type / entitlement from the child's data
  const updateChild = (childId: string) => {
    const child = children.find((c: any) => c.id === childId);
    const edu = eduHistory.find((e: any) => e.child_id === childId);
    // prefer the child's current record; fall back to education history
    const lvl = ((child?.education_level || edu?.education_level) as typeof EDU_LEVELS[number]) || form.education_level;
    const st = ((child?.school_type || edu?.school_type) as "government" | "private") || form.school_type;
    const place = child?.study_place || edu?.study_place || "";
    const rate = rates.find((r: any) => r.school_type === st && r.education_level === lvl && r.academic_year === form.academic_year);
    setForm({
      ...form,
      child_id: childId,
      study_place: place,
      education_level: lvl,
      school_type: st,
      entitled_amount: rate ? Number(rate.max_amount) : 0,
    });
  };
  const updateLevel = (lvl: any) => {
    const rate = rates.find((r: any) => r.school_type === form.school_type && r.education_level === lvl && r.academic_year === form.academic_year);
    setForm({ ...form, education_level: lvl, entitled_amount: Number(rate?.max_amount || form.entitled_amount) });
  };

  const save = async () => {
    if (!form.guardian_id || !form.child_id) return toast.error("กรุณาเลือกผู้มีสิทธิและบุตร");
    const payload: any = { ...form, school_id: null };
    for (const k of ["sem1_pay_date", "sem1_receipt_date", "sem2_pay_date", "sem2_receipt_date"]) {
      if (!payload[k]) payload[k] = null;
    }
    const res = editing
      ? await supabase.from("reimbursements").update(payload).eq("id", editing.id)
      : await supabase.from("reimbursements").insert(payload);
    if (res.error) return toast.error("บันทึกไม่สำเร็จ", { description: res.error.message });
    toast.success("บันทึกสำเร็จ");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["reimb"] });
  };

  const remove = async (id: string) => {
    if (!confirm("ยืนยันลบรายการนี้?")) return;
    const { error } = await supabase.from("reimbursements").delete().eq("id", id);
    if (error) return toast.error("ลบไม่สำเร็จ", { description: error.message });
    toast.success("ลบสำเร็จ");
    qc.invalidateQueries({ queryKey: ["reimb"] });
  };

  const filtered = rows.filter((r: any) => {
    const t = `${r.registration_no} ${r.guardians?.first_name} ${r.children?.child_name} ${r.study_place ?? ""}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  const totals = filtered.reduce((acc, r: any) => {
    const used = Number(r.sem1_amount) + Number(r.sem2_amount);
    acc.entitled += Number(r.entitled_amount);
    acc.used += used;
    acc.remaining += Number(r.entitled_amount) - used;
    return acc;
  }, { entitled: 0, used: 0, remaining: 0 });

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ทะเบียนคุมการเบิกเงินค่าการศึกษาบุตร</h1>
          <p className="text-sm text-muted-foreground">ปีการศึกษา {year} • รวม {filtered.length} รายการ</p>
        </div>
        <div className="flex gap-2">
          <Input type="number" className="w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />พิมพ์</Button>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />เพิ่มรายการเบิก</Button>
        </div>
      </div>

      <div className="print-only mb-4 text-center">
        <div className="text-lg font-bold">ทะเบียนคุมการเบิกเงินค่าการศึกษาบุตร</div>
        <div>{ORG_NAME}</div>
        <div>ประจำปีการศึกษา {year} • พิมพ์เมื่อ {formatThaiDate(new Date().toISOString())}</div>
      </div>

      <Card className="p-4">
        <div className="no-print mb-3 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="ค้นหาเลขทะเบียน/ชื่อผู้มีสิทธิ/ชื่อบุตร/โรงเรียน..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th rowSpan={2}>เลขทะเบียน</th>
                <th rowSpan={2}>ผู้มีสิทธิ</th>
                <th rowSpan={2}>ชื่อบุตร</th>
                <th rowSpan={2}>โรงเรียน</th>
                <th rowSpan={2}>ระดับชั้น</th>
                <th rowSpan={2}>ประเภท</th>
                <th rowSpan={2}>สิทธิ (บาท)</th>
                <th colSpan={3}>ภาคเรียนที่ 1</th>
                <th colSpan={3}>ภาคเรียนที่ 2</th>
                <th rowSpan={2}>คงเหลือ</th>
                <th rowSpan={2}>หมายเหตุ</th>
                <th rowSpan={2} className="no-print">จัดการ</th>
              </tr>
              <tr>
                <th>วันที่จ่าย/ใบเสร็จ</th><th>เลขเอกสาร/ใบเสร็จ</th><th>จำนวนเงิน</th>
                <th>วันที่จ่าย/ใบเสร็จ</th><th>เลขเอกสาร/ใบเสร็จ</th><th>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => {
                const used = Number(r.sem1_amount) + Number(r.sem2_amount);
                const rem = Number(r.entitled_amount) - used;
                return (
                  <tr key={r.id}>
                    <td className="text-center">{r.registration_no}</td>
                    <td>{r.guardians?.prefix}{r.guardians?.first_name} {r.guardians?.last_name}</td>
                    <td>{r.children?.child_name}</td>
                    <td>{r.study_place || "-"}</td>
                    <td>{EDU_LEVEL_LABEL[r.education_level]}</td>
                    <td className="text-center">{SCHOOL_TYPE_LABEL[r.school_type]}</td>
                    <td className="text-right">{formatTHB(r.entitled_amount)}</td>
                    <td className="text-xs">จ่าย: {formatThaiDate(r.sem1_pay_date)}<br/>ใบเสร็จ: {formatThaiDate(r.sem1_receipt_date)}</td>
                    <td className="text-xs">{r.sem1_doc_no || "-"}<br/>{r.sem1_receipt_no || "-"}</td>
                    <td className="text-right">{formatTHB(r.sem1_amount)}</td>
                    <td className="text-xs">จ่าย: {formatThaiDate(r.sem2_pay_date)}<br/>ใบเสร็จ: {formatThaiDate(r.sem2_receipt_date)}</td>
                    <td className="text-xs">{r.sem2_doc_no || "-"}<br/>{r.sem2_receipt_no || "-"}</td>
                    <td className="text-right">{formatTHB(r.sem2_amount)}</td>
                    <td className="text-right font-semibold">{formatTHB(rem)}</td>
                    <td>{r.remark || "-"}</td>
                    <td className="no-print">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        {role === "admin" && <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={15} className="text-center text-muted-foreground">ไม่พบข้อมูล</td></tr>}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="font-semibold">
                  <td colSpan={6} className="text-right">รวมทั้งสิ้น</td>
                  <td className="text-right">{formatTHB(totals.entitled)}</td>
                  <td colSpan={2}></td>
                  <td className="text-right">{formatTHB(filtered.reduce((s, r: any) => s + Number(r.sem1_amount), 0))}</td>
                  <td colSpan={2}></td>
                  <td className="text-right">{formatTHB(filtered.reduce((s, r: any) => s + Number(r.sem2_amount), 0))}</td>
                  <td className="text-right">{formatTHB(totals.remaining)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="print-only mt-12 grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <div>ลงชื่อ ............................................</div>
            <div className="mt-1">(......................................)</div>
            <div className="mt-1">ผู้จัดทำ</div>
          </div>
          <div>
            <div>ลงชื่อ ............................................</div>
            <div className="mt-1">(......................................)</div>
            <div className="mt-1">ผู้ตรวจสอบ</div>
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "แก้ไขรายการเบิก" : "เพิ่มรายการเบิก"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>ปีการศึกษา</Label><Input type="number" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: Number(e.target.value) })} /></div>
            <div>
              <Label>ผู้มีสิทธิ *</Label>
              <select className="flex h-10 w-full rounded-md border bg-background px-3" value={form.guardian_id} onChange={(e) => setForm({ ...form, guardian_id: e.target.value, child_id: "" })}>
                <option value="">-- เลือก --</option>
                {guardians.map((g: any) => <option key={g.id} value={g.id}>{g.employee_code} — {g.prefix}{g.first_name} {g.last_name}</option>)}
              </select>
            </div>
            <div>
              <Label>บุตร *</Label>
              <select className="flex h-10 w-full rounded-md border bg-background px-3" value={form.child_id} onChange={(e) => updateChild(e.target.value)}>
                <option value="">-- เลือก --</option>
                {filteredChildren.map((c: any) => <option key={c.id} value={c.id}>{c.child_name}</option>)}
              </select>
            </div>
            <div>
              <Label>โรงเรียนที่ศึกษา (ดึงอัตโนมัติจากข้อมูลบุตร)</Label>
              <div className="flex h-10 w-full items-center rounded-md border bg-muted px-3 text-sm">
                {form.study_place || (form.child_id ? <span className="text-destructive">บุตรยังไม่มีข้อมูลสถานศึกษาปัจจุบัน</span> : <span className="text-muted-foreground">เลือกบุตรก่อน</span>)}
              </div>
            </div>
            <div>
              <Label>ระดับชั้น *</Label>
              <select className="flex h-10 w-full rounded-md border bg-background px-3" value={form.education_level} onChange={(e) => updateLevel(e.target.value)}>
                {EDU_LEVELS.map(l => <option key={l} value={l}>{EDU_LEVEL_LABEL[l]}</option>)}
              </select>
            </div>
            <div>
              <Label>ประเภทโรงเรียน</Label>
              <select className="flex h-10 w-full rounded-md border bg-background px-3" value={form.school_type} onChange={(e) => setForm({ ...form, school_type: e.target.value as any })}>
                <option value="government">ราชการ</option>
                <option value="private">เอกชน</option>
              </select>
            </div>
            <div className="col-span-2"><Label>สิทธิที่เบิกได้ (บาท)</Label><Input type="number" value={form.entitled_amount} onChange={(e) => setForm({ ...form, entitled_amount: Number(e.target.value) })} /></div>

            <div className="col-span-2 mt-2 rounded-md border bg-muted/50 p-3">
              <div className="mb-2 font-semibold">ภาคเรียนที่ 1</div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>วันที่จ่ายเงิน</Label><ThaiDatePicker value={form.sem1_pay_date} onChange={(v) => setForm({ ...form, sem1_pay_date: v })} /></div>
                <div><Label>เลขที่เอกสารจ่ายเงิน</Label><Input value={form.sem1_doc_no} onChange={(e) => setForm({ ...form, sem1_doc_no: e.target.value })} /></div>
                <div><Label>เลขที่ใบเสร็จ</Label><Input value={form.sem1_receipt_no} onChange={(e) => setForm({ ...form, sem1_receipt_no: e.target.value })} /></div>
                <div><Label>วันที่ใบเสร็จ</Label><ThaiDatePicker value={form.sem1_receipt_date} onChange={(v) => setForm({ ...form, sem1_receipt_date: v })} /></div>
                <div className="col-span-2"><Label>จำนวนเงิน (บาท)</Label><Input type="number" value={form.sem1_amount} onChange={(e) => setForm({ ...form, sem1_amount: Number(e.target.value) })} /></div>
              </div>
            </div>

            <div className="col-span-2 rounded-md border bg-muted/50 p-3">
              <div className="mb-2 font-semibold">ภาคเรียนที่ 2</div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>วันที่จ่ายเงิน</Label><Input type="date" value={form.sem2_pay_date} onChange={(e) => setForm({ ...form, sem2_pay_date: e.target.value })} /></div>
                <div><Label>เลขที่เอกสารจ่ายเงิน</Label><Input value={form.sem2_doc_no} onChange={(e) => setForm({ ...form, sem2_doc_no: e.target.value })} /></div>
                <div><Label>เลขที่ใบเสร็จ</Label><Input value={form.sem2_receipt_no} onChange={(e) => setForm({ ...form, sem2_receipt_no: e.target.value })} /></div>
                <div><Label>วันที่ใบเสร็จ</Label><Input type="date" value={form.sem2_receipt_date} onChange={(e) => setForm({ ...form, sem2_receipt_date: e.target.value })} /></div>
                <div className="col-span-2"><Label>จำนวนเงิน (บาท)</Label><Input type="number" value={form.sem2_amount} onChange={(e) => setForm({ ...form, sem2_amount: Number(e.target.value) })} /></div>
              </div>
            </div>

            <div className="col-span-2"><Label>หมายเหตุ</Label><Input value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} /></div>
            <div className="col-span-2 rounded-md bg-accent/50 p-3 text-sm">
              <div>ยอดเบิกแล้ว: <span className="font-semibold">{formatTHB(form.sem1_amount + form.sem2_amount)}</span> บาท</div>
              <div>คงเหลือ: <span className="font-semibold">{formatTHB(form.entitled_amount - form.sem1_amount - form.sem2_amount)}</span> บาท</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={save}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
