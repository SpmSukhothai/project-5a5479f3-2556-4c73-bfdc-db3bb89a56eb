import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  EDU_LEVEL_LABEL,
  EDU_LEVELS,
  SCHOOL_TYPE_LABEL,
  SUBSIDY_TYPE_LABEL,
  PRIVATE_SUBSIDY_TYPES,
  REIMBURSEMENT_TYPE_LABEL,
  REIMBURSEMENT_TYPES,
  isVocational,
  showsSubsidy,
  programGroupsForLevel,
  formatTHB,
} from "@/lib/labels";
import { CurrencyInput } from "@/components/CurrencyInput";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

const emptyForm = {
  school_type: "government",
  subsidy_type: "none",
  education_level: "primary",
  program_group_id: "",
  reimbursement_type: "fixed_amount",
  academic_year: 2569,
  max_amount: 0,
};

const ROLE_LABEL: Record<string, string> = { admin: "ผู้ดูแลระบบ", finance: "การเงิน" };

function Settings() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...emptyForm });

  const isAdmin = role === "admin";

  const { data: rates = [] } = useQuery({
    queryKey: ["rates-admin"],
    queryFn: async () =>
      (await supabase
        .from("reimbursement_rates")
        .select("*, program_groups(name)")
        .order("academic_year", { ascending: false })
        .order("school_type")
        .order("education_level")).data ?? [],
  });
  const { data: programGroups = [] } = useQuery({
    queryKey: ["program-groups"],
    queryFn: async () => (await supabase.from("program_groups").select("*").eq("active", true).order("name")).data ?? [],
  });

  // รายชื่อผู้ใช้ + สิทธิการเข้าใช้งานระบบ
  const { data: users = [] } = useQuery({
    queryKey: ["users-roles"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return (profiles ?? []).map((p: any) => ({
        ...p,
        roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      }));
    },
  });

  if (role && role !== "admin" && role !== "finance") return <Navigate to="/dashboard" />;

  const openNew = (schoolType: "government" | "private", subsidyType: "none" | "subsidized" | "non_subsidized" = "none") => {
    setEditing(null);
    setForm({ ...emptyForm, school_type: schoolType, subsidy_type: subsidyType });
    setOpen(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      school_type: r.school_type,
      subsidy_type: r.subsidy_type,
      education_level: r.education_level,
      program_group_id: r.program_group_id ?? "",
      reimbursement_type: r.reimbursement_type,
      academic_year: r.academic_year,
      max_amount: Number(r.max_amount),
    });
    setOpen(true);
  };

  const voc = isVocational(form.education_level);
  const subsidyVisible = showsSubsidy(form.school_type, form.education_level);
  const groupOptions = programGroupsForLevel(programGroups, form.education_level);

  // ปรับค่า subsidy_type / program_group_id ให้สอดคล้องกับเงื่อนไขเมื่อเปลี่ยนโรงเรียน/ระดับ
  const normalize = (f: any) => {
    const visible = showsSubsidy(f.school_type, f.education_level);
    const subsidy_type = visible ? (!f.subsidy_type || f.subsidy_type === "none" ? "subsidized" : f.subsidy_type) : "none";
    const validIds = programGroupsForLevel(programGroups, f.education_level).map((g: any) => g.id);
    const program_group_id = isVocational(f.education_level) && validIds.includes(f.program_group_id) ? f.program_group_id : "";
    return { ...f, subsidy_type, program_group_id };
  };

  const save = async () => {
    if (voc && !form.program_group_id) return toast.error("ระดับอาชีวศึกษาต้องเลือกกลุ่มสาขาวิชา");
    const payload: any = {
      school_type: form.school_type,
      subsidy_type: form.subsidy_type,
      education_level: form.education_level,
      program_group_id: voc ? form.program_group_id || null : null,
      reimbursement_type: form.reimbursement_type,
      reimbursement_percent: null,
      academic_year: Number(form.academic_year),
      max_amount: Number(form.max_amount),
    };
    const res = editing
      ? await supabase.from("reimbursement_rates").update(payload).eq("id", editing.id)
      : await supabase.from("reimbursement_rates").insert(payload);
    if (res.error) return toast.error("บันทึกไม่สำเร็จ", { description: res.error.message });
    toast.success("บันทึกสำเร็จ");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["rates-admin"] });
  };

  const remove = async (id: string) => {
    if (!confirm("ยืนยันลบอัตรานี้?")) return;
    const { error } = await supabase.from("reimbursement_rates").delete().eq("id", id);
    if (error) return toast.error("ลบไม่สำเร็จ", { description: error.message });
    toast.success("ลบสำเร็จ");
    qc.invalidateQueries({ queryKey: ["rates-admin"] });
  };

  const govRates = rates.filter((r: any) => r.school_type === "government");
  const privateRates = rates.filter((r: any) => r.school_type === "private");
  const privateSubsidized = privateRates.filter((r: any) => r.subsidy_type === "subsidized");
  const privateNonSubsidized = privateRates.filter((r: any) => r.subsidy_type === "non_subsidized");

  const RateTable = ({
    list,
    showSubsidy,
    showProgramGroup,
  }: {
    list: any[];
    showSubsidy: boolean;
    showProgramGroup: boolean;
  }) => {
    const colCount = 4 + (showSubsidy ? 1 : 0) + (showProgramGroup ? 1 : 0) + (isAdmin ? 1 : 0);
    return (
    <div className="overflow-x-auto">
      <table className="gov-table">
        <thead>
          <tr>
            <th>ปีการศึกษา</th>
            <th>ระดับชั้น</th>
            {showSubsidy && <th>เงินอุดหนุน</th>}
            {showProgramGroup && <th>กลุ่มสาขาวิชา</th>}
            <th>รูปแบบการเบิก</th>
            <th>เพดาน (บาท/ปี)</th>
            {isAdmin && <th style={{ width: 100 }}>จัดการ</th>}
          </tr>
        </thead>
        <tbody>
          {list.map((r: any) => (
            <tr key={r.id}>
              <td className="text-center">{r.academic_year}</td>
              <td>{EDU_LEVEL_LABEL[r.education_level]}</td>
              {showSubsidy && <td>{SUBSIDY_TYPE_LABEL[r.subsidy_type]}</td>}
              {showProgramGroup && <td>{r.program_groups?.name || "-"}</td>}
              <td>{REIMBURSEMENT_TYPE_LABEL[r.reimbursement_type]}</td>
              <td className="text-right">{formatTHB(r.max_amount)}</td>
              {isAdmin && (
                <td>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={colCount} className="text-center text-muted-foreground">
                ยังไม่มีอัตรา
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ตั้งค่าระบบ</h1>
        <p className="text-sm text-muted-foreground">จัดการอัตราการเบิกค่าการศึกษาบุตร และสิทธิการเข้าใช้งาน</p>
      </div>

      {/* สิทธิการเข้าใช้งานระบบ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">สิทธิการเข้าใช้งานระบบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>ลำดับ</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>อีเมล</th>
                  <th>สิทธิการเข้าใช้</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any, i: number) => (
                  <tr key={u.id}>
                    <td className="text-center">{i + 1}</td>
                    <td>{u.full_name || "-"}</td>
                    <td>{u.email || "-"}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 && <span className="text-muted-foreground">ไม่มีสิทธิ</span>}
                        {u.roles.map((r: string) => (
                          <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>
                            {ROLE_LABEL[r] || r}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted-foreground">
                      ยังไม่มีผู้ใช้งาน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* อัตราสถานศึกษาราชการ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">อัตราเงินค่าเล่าเรียน — สถานศึกษาของทางราชการ</CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => openNew("government")}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มอัตรา
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <RateTable list={govRates} showSubsidy={false} showProgramGroup={false} />
        </CardContent>
      </Card>

      {/* อัตราสถานศึกษาเอกชน — ได้รับเงินอุดหนุน */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">อัตราเงินค่าเล่าเรียน — สถานศึกษาของเอกชน (ได้รับเงินอุดหนุน)</CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => openNew("private", "subsidized")}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มอัตรา
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <RateTable list={privateSubsidized} showSubsidy={false} showProgramGroup={true} />
        </CardContent>
      </Card>

      {/* อัตราสถานศึกษาเอกชน — ไม่ได้รับเงินอุดหนุน */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">อัตราเงินค่าเล่าเรียน — สถานศึกษาของเอกชน (ไม่ได้รับเงินอุดหนุน)</CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => openNew("private", "non_subsidized")}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มอัตรา
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <RateTable list={privateNonSubsidized} showSubsidy={false} showProgramGroup={true} />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขอัตรา" : "เพิ่มอัตรา"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ปีการศึกษา</Label>
              <Input type="number" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: Number(e.target.value) })} />
            </div>
            <div>
              <Label>ประเภทโรงเรียน</Label>
              <Select value={form.school_type} onValueChange={(v) => setForm(normalize({ ...form, school_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCHOOL_TYPE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ระดับชั้น</Label>
              <Select value={form.education_level} onValueChange={(v) => setForm(normalize({ ...form, education_level: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDU_LEVELS.map((lv) => (
                    <SelectItem key={lv} value={lv}>
                      {EDU_LEVEL_LABEL[lv]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {subsidyVisible && (
              <div>
                <Label>เงินอุดหนุน</Label>
                <Select value={form.subsidy_type} onValueChange={(v) => setForm({ ...form, subsidy_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIVATE_SUBSIDY_TYPES.map((k) => (
                      <SelectItem key={k} value={k}>
                        {SUBSIDY_TYPE_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {voc && (
              <div className="col-span-2">
                <Label>กลุ่มสาขาวิชา *</Label>
                <Select value={form.program_group_id} onValueChange={(v) => setForm({ ...form, program_group_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- เลือกกลุ่มสาขา --" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupOptions.map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>รูปแบบการเบิก</Label>
              <Select value={form.reimbursement_type} onValueChange={(v) => setForm({ ...form, reimbursement_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REIMBURSEMENT_TYPES.map((k) => (
                    <SelectItem key={k} value={k}>
                      {REIMBURSEMENT_TYPE_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>เพดานสูงสุด (บาท/ปี)</Label>
              <CurrencyInput value={form.max_amount} onChange={(v) => setForm({ ...form, max_amount: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={save}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
