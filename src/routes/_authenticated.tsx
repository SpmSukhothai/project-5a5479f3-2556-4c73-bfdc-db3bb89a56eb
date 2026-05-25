import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  component: () => {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">กำลังโหลด...</div>;
    if (!user) return <Navigate to="/login" />;
    return <AppShell><Outlet /></AppShell>;
  },
});
