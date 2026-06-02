import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { ORG_NAME, SYSTEM_NAME } from "@/lib/labels";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const onPwd = (v: string) => v.replace(/\D/g, "").slice(0, 6);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length !== 6) { toast.error("รหัสผ่านต้องมี 6 หลัก"); return; }
    if (password !== confirm) { toast.error("รหัสผ่านทั้งสองช่องไม่ตรงกัน"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error("ตั้งรหัสผ่านใหม่ไม่สำเร็จ", { description: error.message }); return; }
    toast.success("ตั้งรหัสผ่านใหม่สำเร็จ", { description: "กรุณาเข้าสู่ระบบอีกครั้ง" });
    await supabase.auth.signOut();
    nav({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl md:p-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <BookOpen className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">ตั้งรหัสผ่านใหม่</h1>
          <p className="mt-1 text-sm text-muted-foreground">{SYSTEM_NAME}</p>
          <p className="text-xs text-muted-foreground">{ORG_NAME}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>รหัสผ่านใหม่ 6 หลัก</Label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                required
                placeholder="รหัสผ่าน 6 หลัก"
                value={password}
                onChange={(e) => setPassword(onPwd(e.target.value))}
                className="pr-10 tracking-[0.3em]"
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
          </div>
          <div>
            <Label>ยืนยันรหัสผ่าน</Label>
            <Input
              type={show ? "text" : "password"}
              inputMode="numeric"
              maxLength={6}
              minLength={6}
              required
              placeholder="ยืนยันรหัสผ่าน 6 หลัก"
              value={confirm}
              onChange={(e) => setConfirm(onPwd(e.target.value))}
              className="tracking-[0.3em]"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}</Button>
        </form>
      </div>
    </div>
  );
}
