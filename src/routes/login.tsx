import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { ORG_NAME, SYSTEM_NAME } from "@/lib/labels";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

const REMEMBER_KEY = "spm_sukhothai_remember_email";
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/;

function PasswordField({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        minLength={6}
        required
        placeholder="รหัสผ่านอย่างน้อย 6 ตัว"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
        aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function LoginPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(REMEMBER_KEY) : null;
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  if (!loading && user) return <Navigate to="/dashboard" />;

  const persistRemember = () => {
    if (typeof window === "undefined") return;
    if (remember) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);
  };

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordRegex.test(password)) { toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัว ประกอบด้วยตัวหนังสือและตัวเลข"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error("เข้าสู่ระบบไม่สำเร็จ", { description: error.message }); return; }
    persistRemember();
    toast.success("เข้าสู่ระบบสำเร็จ");
    nav({ to: "/dashboard" });
  };

  const signUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordRegex.test(password)) { toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัว ประกอบด้วยตัวหนังสือและตัวเลข"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (error) { toast.error("สมัครสมาชิกไม่สำเร็จ", { description: error.message }); return; }
    persistRemember();
    toast.success("สมัครสมาชิกสำเร็จ", { description: "เข้าสู่ระบบได้ทันที" });
  };

  const sendReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetBusy(false);
    if (error) { toast.error("ส่งคำขอไม่สำเร็จ", { description: error.message }); return; }
    setResetOpen(false);
    toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว", { description: "กรุณาตรวจสอบอีเมลของคุณ" });
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
                <div>
                  <Label>รหัสผ่าน</Label>
                  <PasswordField value={password} onChange={setPassword} />
                  <p className="mt-1 text-xs text-muted-foreground">อย่างน้อย 6 ตัว ประกอบด้วยตัวหนังสือและตัวเลข (อักขระพิเศษเพิ่มได้)</p>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox checked={remember} onCheckedChange={(c) => setRemember(c === true)} />
                    จดจำการเข้าสู่ระบบ
                  </label>
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email); setResetOpen(true); }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4 pt-4">
                <div><Label>ชื่อ-นามสกุล</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                <div><Label>อีเมล</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div>
                  <Label>รหัสผ่าน</Label>
                  <PasswordField value={password} onChange={setPassword} />
                  <p className="mt-1 text-xs text-muted-foreground">อย่างน้อย 6 ตัว ประกอบด้วยตัวหนังสือและตัวเลข (อักขระพิเศษเพิ่มได้)</p>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "กำลังสมัคร..." : "สมัครสมาชิก"}</Button>
                <p className="text-center text-xs text-muted-foreground">ผู้สมัครคนแรกจะได้สิทธิผู้ดูแลระบบโดยอัตโนมัติ</p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <form onSubmit={sendReset}>
            <DialogHeader>
              <DialogTitle>ลืมรหัสผ่าน</DialogTitle>
              <DialogDescription>กรอกอีเมลของคุณ ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>อีเมล</Label>
              <Input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>ยกเลิก</Button>
              <Button type="submit" disabled={resetBusy}>{resetBusy ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
