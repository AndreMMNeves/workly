import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SeedBoot from "@/components/SeedBoot";
import { createClient } from "@/lib/supabase/server";
import { HideValuesProvider } from "@/lib/hideValues";

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
    <HideValuesProvider>
      <SeedBoot />
      <div className="flex min-h-screen">
        <Sidebar userEmail={user.email ?? ""} />
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </HideValuesProvider>
  );
}
