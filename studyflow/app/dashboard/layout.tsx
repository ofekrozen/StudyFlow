import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import NavBar from "@/components/layout/NavBar";

export const metadata: Metadata = {
  title: "Dashboard - StudyFlow",
  description: "Your daily study flow and tasks",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const initials = user?.email ? user.email[0].toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <NavBar email={user?.email ?? ""} initials={initials} />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
