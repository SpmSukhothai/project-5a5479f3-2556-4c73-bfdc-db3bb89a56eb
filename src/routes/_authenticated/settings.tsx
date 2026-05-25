import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EDU_LEVEL_LABEL, EDU_LEVELS, SCHOOL_TYPE_LABEL, formatTHB } from "@/lib/labels";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

function Settings() {
  const { role } = useAuth();
  const qc = useQueryClient();

  const { data: rates = [] } = useQuery({
    queryKey: ["rates-admin"],
    queryFn: async () => (await supabase.from("reimbursement_rates").select("*").order("school_type").order("education_level")).data ?? [],
  });

  if (role && role !== "admin") return <Navigate to="/dashboard" />;

  const update = async (id: string, max_amount: number) => {
    const { error } = await supabase.from("reimbursement_rates").update({ max_amount }).eq("id", id);
    if (error) return toast.error("บันทึกไม่สำเร็จ", { description: error.message });
    toast.success("บันทึกสำเร็จ");
    qc.invalidateQueries({ queryKey: ["rates-admin"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ตั้งค่าระบบ</h1>
        <p className="text-sm text-muted-foreground">จัดการอัตราการเบิก</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">อัตราการเบิกตามระดับชั้น (ปีการศึกษา 2569)</CardTitle></CardHeader>
        <CardContent>
          <table className="gov-table">
            <thead><tr><th>ประเภทโรงเรียน</th><th>ระดับชั้น</th><th>วงเงินสูงสุด (บาท/ปี)</th><th>บันทึก</th></tr></thead>
            <tbody>
              {rates.map((r: any) => (
                <RateRow key={r.id} r={r} onSave={update} />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function RateRow({ r, onSave }: { r: any; onSave: (id: string, n: number) => void }) {
  return (
    <tr>
      <td>{SCHOOL_TYPE_LABEL[r.school_type]}</td>
      <td>{EDU_LEVEL_LABEL[r.education_level]}</td>
      <td><Input type="number" defaultValue={r.max_amount} id={`rate-${r.id}`} /></td>
      <td><Button size="sm" onClick={() => {
        const v = Number((document.getElementById(`rate-${r.id}`) as HTMLInputElement).value);
        onSave(r.id, v);
      }}>บันทึก</Button></td>
    </tr>
  );
}
