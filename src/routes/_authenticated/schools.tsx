import { createFileRoute, Navigate } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_authenticated/schools")({ component: SchoolsPage });

function SchoolsPage() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<{ school_code: string; school_name: string; school_type: "government" | "private"; province: string }>({ school_code: "", school_name: "", school_type: "government", province: "สุโขทัย" });

  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: async () => (await supabase.from("schools").select("*").order("school_code")).data ?? [],
  });

  const filtered = schools.filter((s: any) =>
    s.school_name.toLowerCase().includes(q.toLowerCase()) || s.school_code.toLowerCase().includes(q.toLowerCase())
  );

  const openNew = () => { setEditing(null); setForm({ school_code: "", school_name: "", school_type: "government", province: "สุโขทัย" }); setOpen(true); };
  const openEdit = (s: any) => { setEditing(s); setForm(s); setOpen(true); };

  const save = async () => {
    const payload = { ...form };
    const res = editing
      ? await supabase.from("schools").update(payload).eq("id", editing.id)
      : await supabase.from("schools").insert(payload);
    if (res.error) return toast.error("บันทึกไม่สำเร็จ", { description: res.error.message });
    toast.success("บันทึกสำเร็จ");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["schools"] });
  };

  const remove = async (id: string) => {
    if (!confirm("ยืนยันลบโรงเรียนนี้?")) return;
    const { error } = await supabase.from("schools").delete().eq("id", id);
    if (error) return toast.error("ลบไม่สำเร็จ", { description: error.message });
    toast.success("ลบสำเร็จ");
    qc.invalidateQueries({ queryKey: ["schools"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ฐานข้อมูลโรงเรียน</h1>
          <p className="text-sm text-muted-foreground">รวม {schools.length} แห่ง</p>
        </div>
        {role === "admin" && <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />เพิ่มโรงเรียน</Button>}
      </div>

      <Card className="p-4">
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="ค้นหาชื่อ/รหัสโรงเรียน..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ลำดับ</th>
                <th>รหัสโรงเรียน</th>
                <th>ชื่อโรงเรียน</th>
                <th>ประเภท</th>
                <th>จังหวัด</th>
                {role === "admin" && <th style={{ width: 120 }}>จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any, i: number) => (
                <tr key={s.id}>
                  <td className="text-center">{i + 1}</td>
                  <td>{s.school_code}</td>
                  <td>{s.school_name}</td>
                  <td>{SCHOOL_TYPE_LABEL[s.school_type]}</td>
                  <td>{s.province}</td>
                  {role === "admin" && (
                    <td>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground">ไม่พบข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "แก้ไขโรงเรียน" : "เพิ่มโรงเรียน"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>รหัสโรงเรียน</Label><Input value={form.school_code} onChange={(e) => setForm({ ...form, school_code: e.target.value })} /></div>
            <div><Label>ชื่อโรงเรียน</Label><Input value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} /></div>
            <div>
              <Label>ประเภท</Label>
              <Select value={form.school_type} onValueChange={(v) => setForm({ ...form, school_type: v as "government" | "private" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">ราชการ</SelectItem>
                  <SelectItem value="private">เอกชน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>จังหวัด</Label><Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></div>
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
