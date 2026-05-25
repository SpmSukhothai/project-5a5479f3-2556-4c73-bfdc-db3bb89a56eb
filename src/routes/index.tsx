import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: () => {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">กำลังโหลด...</div>;
    return <Navigate to={user ? "/dashboard" : "/login"} />;
  },
});
