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
import { Pencil, Trash2, Plus, Search, History } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { formatThaiDate } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/guardians")({ component: GuardiansPage });

function GuardiansPage() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ employee_code: "", prefix: "นาย", first_name: "", last_name: "", national_id: "", school_id: "", phone: "", position: "" });
  const [histFor, setHistFor] = useState<any>(null);

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
                <th style={{ width: 130 }}>จัดการ</th>
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
                      <Button size="icon" variant="ghost" title="ประวัติ/ย้ายต้นสังกัด" onClick={() => setHistFor(r)}><History className="h-4 w-4" /></Button>
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

      {histFor && <AffiliationHistoryDialog guardian={histFor} schools={schools} onClose={() => setHistFor(null)} />}
    </div>
  );
}

function AffiliationHistoryDialog({ guardian, schools, onClose }: { guardian: any; schools: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newSchool, setNewSchool] = useState("");
  const [position, setPosition] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const { data: history = [] } = useQuery({
    queryKey: ["affiliation-history", guardian.id],
    queryFn: async () => (await supabase.from("guardian_affiliation_history").select("*, schools(school_name)").eq("guardian_id", guardian.id).order("start_date", { ascending: false })).data ?? [],
  });

  const submit = async () => {
    if (!newSchool) return toast.error("กรุณาเลือกโรงเรียนต้นสังกัดใหม่");
    const { error } = await supabase.from("guardian_affiliation_history").insert({
      guardian_id: guardian.id, school_id: newSchool, position: position || null, start_date: startDate, note: note || null, is_current: true,
    });
    if (error) return toast.error("บันทึกไม่สำเร็จ", { description: error.message });
    const { error: e2 } = await supabase.from("guardians").update({ school_id: newSchool, position: position || guardian.position }).eq("id", guardian.id);
    if (e2) return toast.error("อัปเดตข้อมูลปัจจุบันไม่สำเร็จ", { description: e2.message });
    toast.success("บันทึกการย้ายต้นสังกัดสำเร็จ");
    setAdding(false); setNewSchool(""); setPosition(""); setNote("");
    qc.invalidateQueries({ queryKey: ["affiliation-history", guardian.id] });
    qc.invalidateQueries({ queryKey: ["guardians"] });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>ประวัติต้นสังกัด — {guardian.prefix}{guardian.first_name} {guardian.last_name}</DialogTitle></DialogHeader>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {history.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีประวัติ</p>}
          {history.map((h: any) => (
            <div key={h.id} className="flex items-start justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{h.schools?.school_name || "-"}</div>
                <div className="text-muted-foreground">{h.position || "-"}</div>
                <div className="text-xs text-muted-foreground">{formatThaiDate(h.start_date)} – {h.end_date ? formatThaiDate(h.end_date) : "ปัจจุบัน"}</div>
                {h.note && <div className="text-xs text-muted-foreground">หมายเหตุ: {h.note}</div>}
              </div>
              {h.is_current && <span className="rounded bg-success/15 px-2 py-0.5 text-xs text-success">ปัจจุบัน</span>}
            </div>
          ))}
        </div>

        {adding ? (
          <div className="space-y-3 border-t pt-3">
            <div>
              <Label>โรงเรียนต้นสังกัดใหม่ *</Label>
              <Select value={newSchool} onValueChange={setNewSchool}>
                <SelectTrigger><SelectValue placeholder="-- เลือก --" /></SelectTrigger>
                <SelectContent>{schools.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.school_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>วันที่มีผล</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
              <div><Label>ตำแหน่ง</Label><Input value={position} onChange={(e) => setPosition(e.target.value)} /></div>
            </div>
            <div><Label>หมายเหตุ</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdding(false)}>ยกเลิก</Button>
              <Button onClick={submit}>บันทึกการย้าย</Button>
            </div>
          </div>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>ปิด</Button>
            <Button onClick={() => setAdding(true)}><Plus className="mr-2 h-4 w-4" />ย้ายต้นสังกัด</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
