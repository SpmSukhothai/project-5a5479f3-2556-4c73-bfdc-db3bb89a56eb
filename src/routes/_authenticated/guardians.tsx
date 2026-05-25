import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/guardians")({ component: GuardiansPage });

function GuardiansPage() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ employee_code: "", prefix: "นาย", first_name: "", last_name: "", national_id: "", school_id: "", phone: "", position: "" });

  const { data: schools = [] } = useQuery({ queryKey: ["schools-list"], queryFn: async () => (await supabase.from("schools").select("id, school_name").order("school_name")).data ?? [] });
  const { data: rows = [] } = useQuery({
    queryKey: ["guardians"],
    queryFn: async () => (await supabase.from("guardians").select("*, schools(school_name)").order("employee_code")).data ?? [],
  });

  const filtered = rows.filter((r: any) => {
    const t = `${r.employee_code} ${r.first_name} ${r.last_name} ${r.national_id || ""}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  const openNew = () => { setEditing(null); setForm({ employee_code: "", prefix: "นาย", first_name: "", last_name: "", national_id: "", school_id: "", phone: "", position: "" }); setOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...r, school_id: r.school_id ?? "" }); setOpen(true); };

  const save = async () => {
    const payload = { ...form, school_id: form.school_id || null };
    const res = editing
      ? await supabase.from("guardians").update(payload).eq("id", editing.id)
      : await supabase.from("guardians").insert(payload);
    if (res.error) return toast.error("บันทึกไม่สำเร็จ", { description: res.error.message });
    toast.success("บันทึกสำเร็จ");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["guardians"] });
  };

  const remove = async (id: string) => {
    if (!confirm("ยืนยันลบรายการนี้?")) return;
    const { error } = await supabase.from("guardians").delete().eq("id", id);
    if (error) return toast.error("ลบไม่สำเร็จ", { description: error.message });
    toast.success("ลบสำเร็จ");
    qc.invalidateQueries({ queryKey: ["guardians"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ฐานข้อมูลผู้มีสิทธิ</h1>
          <p className="text-sm text-muted-foreground">รวม {rows.length} คน</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />เพิ่มผู้มีสิทธิ</Button>
      </div>

      <Card className="p-4">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="ค้นหาชื่อ/รหัส/บัตรประชาชน..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>ลำดับ</th>
                <th>รหัสบุคลากร</th>
                <th>ชื่อ-นามสกุล</th>
                <th>เลขบัตรประชาชน</th>
                <th>โรงเรียนต้นสังกัด</th>
                <th>เบอร์โทร</th>
                <th>ตำแหน่ง</th>
                <th style={{ width: 100 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any, i: number) => (
                <tr key={r.id}>
                  <td className="text-center">{i + 1}</td>
                  <td>{r.employee_code}</td>
                  <td>{r.prefix}{r.first_name} {r.last_name}</td>
                  <td>{r.national_id || "-"}</td>
                  <td>{r.schools?.school_name || "-"}</td>
                  <td>{r.phone || "-"}</td>
                  <td>{r.position || "-"}</td>
                  <td>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      {role === "admin" && <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-muted-foreground">ไม่พบข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "แก้ไขผู้มีสิทธิ" : "เพิ่มผู้มีสิทธิ"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>รหัสบุคลากร *</Label><Input value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} /></div>
            <div>
              <Label>คำนำหน้า *</Label>
              <Select value={form.prefix} onValueChange={(v) => setForm({ ...form, prefix: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["นาย", "นาง", "นางสาว", "ว่าที่ร้อยตรี", "ดร."].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>ชื่อ *</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><Label>นามสกุล *</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            <div className="col-span-2"><Label>เลขบัตรประชาชน</Label><Input maxLength={13} value={form.national_id || ""} onChange={(e) => setForm({ ...form, national_id: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>โรงเรียนต้นสังกัด</Label>
              <Select value={form.school_id || ""} onValueChange={(v) => setForm({ ...form, school_id: v })}>
                <SelectTrigger><SelectValue placeholder="-- เลือก --" /></SelectTrigger>
                <SelectContent>{schools.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.school_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>เบอร์โทร</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>ตำแหน่ง</Label><Input value={form.position || ""} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
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
