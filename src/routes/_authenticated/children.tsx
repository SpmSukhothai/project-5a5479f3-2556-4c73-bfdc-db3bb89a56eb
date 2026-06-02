import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatThaiDate, EDU_LEVELS, EDU_LEVEL_LABEL, SCHOOL_TYPE_LABEL } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/children")({ component: ChildrenPage });

const emptyForm = { guardian_id: "", child_name: "", birth_date: "", study_place: "", education_level: "", school_type: "government", is_active: true };

function ChildrenPage() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...emptyForm });

  const { data: guardians = [] } = useQuery({ queryKey: ["guardians-list"], queryFn: async () => (await supabase.from("guardians").select("id, prefix, first_name, last_name, employee_code").order("employee_code")).data ?? [] });
  const { data: rows = [] } = useQuery({
    queryKey: ["children"],
    queryFn: async () => (await supabase.from("children").select("*, guardians(prefix, first_name, last_name, employee_code)").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = rows.filter((r: any) => `${r.child_name} ${r.guardians?.first_name || ""}`.toLowerCase().includes(q.toLowerCase()));

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...emptyForm, ...r, study_place: r.study_place ?? "", education_level: r.education_level ?? "" }); setOpen(true); };

  const save = async () => {
    if (!form.guardian_id) return toast.error("กรุณาเลือกผู้มีสิทธิ");
    const { guardians, ...rest } = form;
    const payload = { ...rest, education_level: form.education_level || null };
    const res = editing
      ? await supabase.from("children").update(payload).eq("id", editing.id)
      : await supabase.from("children").insert(payload);
    if (res.error) return toast.error("บันทึกไม่สำเร็จ", { description: res.error.message });
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
                <th>ผู้มีสิทธิ</th>
                <th>ชื่อบุตร</th>
                <th>วันเกิด</th>
                <th>อายุ</th>
                <th>สถานะ</th>
                <th style={{ width: 100 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any, i: number) => (
                <tr key={r.id}>
                  <td className="text-center">{i + 1}</td>
                  <td>{r.guardians?.prefix}{r.guardians?.first_name} {r.guardians?.last_name}</td>
                  <td>{r.child_name}</td>
                  <td>{formatThaiDate(r.birth_date)}</td>
                  <td className="text-center">{age(r.birth_date)} ปี</td>
                  <td className="text-center">{r.is_active ? <span className="text-success">กำลังศึกษา</span> : <span className="text-muted-foreground">ไม่ใช้สิทธิ</span>}</td>
                  <td>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      {role === "admin" && <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-muted-foreground">ไม่พบข้อมูล</td></tr>}
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
            <div><Label>วันเดือนปีเกิด *</Label><Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></div>
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
