import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type FileRouteProps = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: FileRouteProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=/dashboard`, request.url));

  const { data: quotation } = await supabase
    .from("quotations")
    .select("storage_path,original_filename")
    .eq("id", id)
    .single();
  if (!quotation) return new NextResponse("Quotation not found", { status: 404 });

  const download = request.nextUrl.searchParams.get("download") === "1";
  const { data, error } = await supabase.storage
    .from("quotations")
    .createSignedUrl(quotation.storage_path, 60, download ? { download: quotation.original_filename } : undefined);
  if (error || !data) return new NextResponse("File unavailable", { status: 404 });

  const response = NextResponse.redirect(data.signedUrl);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
