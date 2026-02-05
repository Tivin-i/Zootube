import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import AdminDashboard to reduce initial bundle size
// Only load admin components when needed (admin route)
const AdminDashboard = dynamic(() => import("@/components/AdminDashboard"), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg text-gray-600">Loading admin dashboard...</div>
    </div>
  ),
});

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-600">Loading…</div>}>
      <AdminDashboard user={user} />
    </Suspense>
  );
}
