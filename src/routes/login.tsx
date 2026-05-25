import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen } from "lucide-react";
import { ORG_NAME, SYSTEM_NAME } from "@/lib/labels";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" />;

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error("เข้าสู่ระบบไม่สำเร็จ", { description: error.message }); return; }
    toast.success("เข้าสู่ระบบสำเร็จ");
    nav({ to: "/dashboard" });
  };

  const signUp = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (error) { toast.error("สมัครสมาชิกไม่สำเร็จ", { description: error.message }); return; }
    toast.success("สมัครสมาชิกสำเร็จ", { description: "เข้าสู่ระบบได้ทันที" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground md:flex">
          <div>
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              <BookOpen className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold leading-tight">{SYSTEM_NAME}</h1>
            <p className="mt-2 text-sm opacity-85">{ORG_NAME}</p>
          </div>
          <div className="space-y-2 text-sm opacity-80">
            <p>✓ บันทึกและตรวจสอบสิทธิการเบิกอย่างเป็นระบบ</p>
            <p>✓ คำนวณยอดคงเหลืออัตโนมัติ</p>
            <p>✓ ออกรายงานทะเบียนคุมราชการแบบมาตรฐาน</p>
            <p>✓ รองรับการพิมพ์เอกสาร A4</p>
          </div>
        </div>
        <div className="p-8 md:p-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold">เข้าสู่ระบบ</h2>
            <p className="text-sm text-muted-foreground">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">เข้าสู่ระบบ</TabsTrigger>
              <TabsTrigger value="signup">สมัครสมาชิก</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4 pt-4">
                <div><Label>อีเมล</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>รหัสผ่าน</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4 pt-4">
                <div><Label>ชื่อ-นามสกุล</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                <div><Label>อีเมล</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>รหัสผ่าน</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "กำลังสมัคร..." : "สมัครสมาชิก"}</Button>
                <p className="text-center text-xs text-muted-foreground">ผู้สมัครคนแรกจะได้สิทธิผู้ดูแลระบบโดยอัตโนมัติ</p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
