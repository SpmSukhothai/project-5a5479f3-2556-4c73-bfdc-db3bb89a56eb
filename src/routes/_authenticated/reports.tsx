import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer } from "lucide-react";
import { formatTHB, formatThaiDate, ORG_NAME, SCHOOL_TYPE_LABEL, EDU_LEVEL_LABEL } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/reports")({ component: Reports });

function Reports() {
  const [year, setYear] = useState(2569);
  const { data: rows = [] } = useQuery({
    queryKey: ["reports", year],
    queryFn: async () => (await supabase.from("reimbursements")
      .select("*, guardians(prefix,first_name,last_name,employee_code), children(child_name)")
      .eq("academic_year", year)).data ?? [],
  });

  const bySchool: Record<string, { count: number; amount: number }> = {};
  const byGuardian: Record<string, { name: string; count: number; entitled: number; used: number }> = {};
  const byMonth: Record<string, number> = {};
  const byType: Record<string, number> = { government: 0, private: 0 };

  rows.forEach((r: any) => {
    const used = Number(r.sem1_amount) + Number(r.sem2_amount);
    const sname = r.study_place || "ไม่ระบุ";
    if (!bySchool[sname]) bySchool[sname] = { count: 0, amount: 0 };
    bySchool[sname].count++;
    bySchool[sname].amount += used;
    const gkey = r.guardian_id;
    if (!byGuardian[gkey]) byGuardian[gkey] = { name: `${r.guardians?.prefix}${r.guardians?.first_name} ${r.guardians?.last_name}`, count: 0, entitled: 0, used: 0 };
    byGuardian[gkey].count++;
    byGuardian[gkey].entitled += Number(r.entitled_amount);
    byGuardian[gkey].used += used;
    byType[r.school_type] += used;
    [["sem1_pay_date", "sem1_amount"], ["sem2_pay_date", "sem2_amount"]].forEach(([d, a]) => {
      if (r[d]) {
        const m = new Date(r[d]).toLocaleDateString("th-TH", { year: "numeric", month: "long" });
        byMonth[m] = (byMonth[m] || 0) + Number(r[a]);
      }
    });
  });

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">รายงานสรุป</h1>
          <p className="text-sm text-muted-foreground">รายงานข้อมูลการเบิกประจำปีการศึกษา {year}</p>
        </div>
        <div className="flex gap-2">
          <Input type="number" className="w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />พิมพ์</Button>
        </div>
      </div>

      <div className="print-only text-center">
        <div className="text-lg font-bold">รายงานสรุปการเบิกเงินค่าการศึกษาบุตร</div>
        <div>{ORG_NAME}</div>
        <div>ปีการศึกษา {year} • พิมพ์เมื่อ {formatThaiDate(new Date().toISOString())}</div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">สรุปรายโรงเรียน</CardTitle></CardHeader>
        <CardContent>
          <table className="gov-table">
            <thead><tr><th>ลำดับ</th><th>โรงเรียน</th><th>จำนวนผู้ใช้สิทธิ</th><th>ยอดเบิก (บาท)</th></tr></thead>
            <tbody>
              {Object.entries(bySchool).map(([n, v], i) => (
                <tr key={n}><td className="text-center">{i + 1}</td><td>{n}</td><td className="text-center">{v.count}</td><td className="text-right">{formatTHB(v.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">สรุปรายผู้มีสิทธิ</CardTitle></CardHeader>
        <CardContent>
          <table className="gov-table">
            <thead><tr><th>ลำดับ</th><th>ผู้มีสิทธิ</th><th>จำนวนบุตร</th><th>สิทธิรวม</th><th>ใช้ไป</th><th>คงเหลือ</th></tr></thead>
            <tbody>
              {Object.values(byGuardian).map((g, i) => (
                <tr key={i}><td className="text-center">{i + 1}</td><td>{g.name}</td><td className="text-center">{g.count}</td>
                  <td className="text-right">{formatTHB(g.entitled)}</td><td className="text-right">{formatTHB(g.used)}</td>
                  <td className="text-right">{formatTHB(g.entitled - g.used)}</td></tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">สรุปรายเดือน / ประเภทโรงเรียน</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <table className="gov-table">
            <thead><tr><th>เดือน</th><th>ยอดเบิก (บาท)</th></tr></thead>
            <tbody>{Object.entries(byMonth).map(([m, v]) => <tr key={m}><td>{m}</td><td className="text-right">{formatTHB(v)}</td></tr>)}</tbody>
          </table>
          <table className="gov-table">
            <thead><tr><th>ประเภทโรงเรียน</th><th>ยอดเบิก (บาท)</th></tr></thead>
            <tbody>{Object.entries(byType).map(([t, v]) => <tr key={t}><td>{SCHOOL_TYPE_LABEL[t]}</td><td className="text-right">{formatTHB(v)}</td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
