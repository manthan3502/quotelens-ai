import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseSessionCookie } from "@/src/lib/supabase/session";
import { safeRedirectPath } from "@/src/lib/navigation/safeRedirect";
import { signIn, signUp } from "./actions";

type LoginPageProps = { searchParams: Promise<{ error?: string; message?: string; next?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next ?? null);
  const cookieStore = await cookies();
  if (hasSupabaseSessionCookie(cookieStore.getAll())) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect(next);
  }

  return (
    <main className="container" style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "76px 1fr", alignItems: "start" }}>
      <header style={{ display: "flex", alignItems: "center" }}><Brand /></header>
      <section style={{ width: "min(100%, 430px)", margin: "70px auto", textAlign: "center" }}>
        <p className="eyebrow">Welcome</p>
        <h1 style={{ margin: 0, fontSize: "clamp(2.2rem, 7vw, 3.4rem)", letterSpacing: "-0.055em" }}>Your quotes, clearly compared.</h1>
        <p className="muted" style={{ margin: "16px 0 28px", lineHeight: 1.6 }}>Sign in or create an account to start a private comparison.</p>
        <form className="card" style={{ padding: 26, display: "grid", gap: 18, textAlign: "left" }}>
          {params.error ? <p role="alert" style={{ margin: 0, padding: 12, borderRadius: 9, background: "#fff0ed", color: "#8f2f1d", fontSize: 14 }}>{params.error}</p> : null}
          {params.message ? <p role="status" style={{ margin: 0, padding: 12, borderRadius: 9, background: "var(--soft)", color: "var(--accent-dark)", fontSize: 14 }}>{params.message}</p> : null}
          <input type="hidden" name="next" value={next} />
          <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
          <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div>
          <button className="button" formAction={signIn}>Sign in</button>
          <button className="button secondary" formAction={signUp}>Create account</button>
        </form>
        <Link href="/" className="muted" style={{ display: "inline-block", marginTop: 22, fontSize: 14 }}>← Back to home</Link>
      </section>
    </main>
  );
}
