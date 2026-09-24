import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { createClient } from "@/src/lib/supabase/server";
import { signOut } from "./actions";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main>
      <header style={{ height: 72, borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,.88)", backdropFilter: "blur(14px)" }}>
        <div className="container" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <Brand href="/dashboard" />
          <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Link className="button ghost" href="/dashboard">Dashboard</Link>
            <form action={signOut}><button className="button ghost" type="submit">Sign out</button></form>
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}
