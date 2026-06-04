import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Baby, BookOpen, Wallet, TrendingUp } from "lucide-react";
import { formatTHB, EDU_LEVEL_LABEL } from "@/lib/labels";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [guardians, children, reimbs, rates] = await Promise.all([
        supabase.from("guardians").select("id", { count: "exact", head: true }),
        supabase.from("children").select("id", { count: "exact", head: true }),
        supabase.from("reimbursements").select("*").order("created_at", { ascending: false }),
        supabase.from("reimbursement_rates").select("*"),
      ]);
      return {
        guardiansCount: guardians.count ?? 0,
        childrenCount: children.count ?? 0,
        reimbs: reimbs.data ?? [],
        rates: rates.data ?? [],
      };
    },
  });

  if (isLoading || !data) return <div className="text-muted-foreground">กำลังโหลดข้อมูล...</div>;

  const totalAmount = data.reimbs.reduce((s, r) => s + Number(r.sem1_amount) + Number(r.sem2_amount), 0);
  const totalEntitled = data.reimbs.reduce((s, r) => s + Number(r.entitled_amount), 0);
  const remaining = totalEntitled - totalAmount;

  // By school
  const bySchool: Record<string, number> = {};
  data.reimbs.forEach((r: any) => {
    const name = r.study_place ?? "ไม่ระบุ";
    bySchool[name] = (bySchool[name] || 0) + Number(r.sem1_amount) + Number(r.sem2_amount);
  });
  const bySchoolData = Object.entries(bySchool).map(([k, v]) => ({ name: k, amount: v })).slice(0, 8);

  // By level
  const byLevel: Record<string, number> = {};
  data.reimbs.forEach((r: any) => {
    byLevel[r.education_level] = (byLevel[r.education_level] || 0) + Number(r.sem1_amount) + Number(r.sem2_amount);
  });
  const byLevelData = Object.entries(byLevel).map(([k, v]) => ({ name: EDU_LEVEL_LABEL[k] || k, value: v }));

  // Monthly (from sem1/sem2 pay dates)
  const byMonth: Record<string, number> = {};
  data.reimbs.forEach((r: any) => {
    [["sem1_pay_date", "sem1_amount"], ["sem2_pay_date", "sem2_amount"]].forEach(([dKey, aKey]) => {
      if (r[dKey]) {
        const m = new Date(r[dKey]).toLocaleDateString("th-TH", { month: "short", year: "2-digit" });
        byMonth[m] = (byMonth[m] || 0) + Number(r[aKey]);
      }
    });
  });
  const monthlyData = Object.entries(byMonth).map(([name, amount]) => ({ name, amount }));

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#8b5cf6"];

  const stats = [
    { label: "ผู้มีสิทธิทั้งหมด", value: data.guardiansCount, icon: Users, color: "text-chart-1" },
    { label: "บุตรผู้ใช้สิทธิ", value: data.childrenCount, icon: Baby, color: "text-chart-2" },
    { label: "รายการเบิก", value: data.reimbs.length, icon: BookOpen, color: "text-chart-3" },
    { label: "ยอดเงินเบิกรวม (บาท)", value: formatTHB(totalAmount), icon: Wallet, color: "text-chart-4" },
    { label: "ยอดคงเหลือ (บาท)", value: formatTHB(remaining), icon: TrendingUp, color: "text-chart-5" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">หน้าหลัก</h1>
        <p className="text-sm text-muted-foreground">สรุปข้อมูลการเบิกเงินค่าการศึกษาบุตร ประจำปีการศึกษา 2569</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
                  <div className="mt-2 text-2xl font-bold">{s.value}</div>
                </div>
                <s.icon className={`h-8 w-8 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">ยอดเบิกรายเดือน</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: any) => formatTHB(v as number) + " บาท"} />
                <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">ยอดเบิกแยกตามระดับชั้น</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byLevelData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {byLevelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatTHB(v as number) + " บาท"} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">ยอดเบิกแยกตามโรงเรียน</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bySchoolData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" fontSize={11} width={140} />
                <Tooltip formatter={(v: any) => formatTHB(v as number) + " บาท"} />
                <Bar dataKey="amount" fill="var(--color-gov-gold)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
