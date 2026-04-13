import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SeedBoot from "@/components/SeedBoot";
import { createClient } from "@/lib/supabase/server";
import { HideValuesProvider } from "@/lib/hideValues";
import { ToastProvider } from "@/lib/toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <HideValuesProvider>
        <SeedBoot />
        <div className="flex min-h-screen">
          <Sidebar userEmail={user.email ?? ""} />
          <main className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full pb-24 md:pb-8">
            {children}
          </main>
        </div>
        <MobileNav />
      </HideValuesProvider>
    </ToastProvider>
  );
}
