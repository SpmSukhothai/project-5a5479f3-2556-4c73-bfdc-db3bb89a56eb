import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, School, Users, Baby, BookOpen, FileBarChart, Settings, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ORG_NAME, SYSTEM_NAME } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
  { to: "/reimbursements", label: "ทะเบียนคุมการเบิก", icon: BookOpen },
  { to: "/guardians", label: "ผู้มีสิทธิ", icon: Users },
  { to: "/children", label: "บุตรผู้ใช้สิทธิ", icon: Baby },
  { to: "/schools", label: "โรงเรียน", icon: School },
  { to: "/reports", label: "รายงาน", icon: FileBarChart },
  { to: "/settings", label: "ตั้งค่า", icon: Settings, adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const nav2 = useNavigate();
  const { user, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {open && <div className="no-print fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn(
        "no-print fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-all lg:static lg:translate-x-0",
        collapsed ? "w-20" : "w-72",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="border-b border-sidebar-border px-5 py-5">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold leading-tight">{SYSTEM_NAME}</div>
                <div className="truncate text-xs opacity-80">{ORG_NAME}</div>
              </div>
            )}
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.filter(n => !n.adminOnly || role === "admin").map((n) => {
            const Icon = n.icon;
            const active = loc.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} title={collapsed ? n.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                  collapsed && "justify-center",
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                <Icon className="h-4 w-4 shrink-0" />{!collapsed && n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs">
          {!collapsed && (
            <div className="mb-2 truncate">
              <div className="font-medium">{user?.email}</div>
              <div className="opacity-70">สิทธิ: {role === "admin" ? "ผู้ดูแลระบบ" : role === "finance" ? "เจ้าหน้าที่การเงิน" : "-"}</div>
            </div>
          )}
          <Button variant="secondary" size="sm" className="w-full" onClick={async () => { await signOut(); nav2({ to: "/login" }); }}>
            <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />{!collapsed && "ออกจากระบบ"}
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-4 py-3 shadow-sm lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} title="เมนู">
            <Menu className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "ขยายเมนู" : "ยุบเมนู"}>
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">ระบบราชการ</div>
            <div className="text-sm font-semibold">{ORG_NAME}</div>
          </div>
          <div className="hidden text-right text-xs text-muted-foreground md:block">
            ปีการศึกษาปัจจุบัน <span className="font-semibold text-foreground">2569</span>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        <footer className="no-print border-t bg-card px-4 py-3 text-center text-xs text-muted-foreground lg:px-8">
          © {new Date().getFullYear()} {ORG_NAME}
        </footer>
      </div>
    </div>
  );
}
