import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import {
  invalidCredentialsMessage,
  loginSchema,
  type LoginInput,
} from "@/app/(auth)/login/login-schema";
import { getLoginRedirectTarget } from "@/lib/auth/redirect";

function isInvalidCredentialsError(error: { code?: string; message?: string }) {
  return (
    error.code === "invalid_credentials" ||
    /invalid login credentials|invalid credentials|email or password/i.test(
      error.message ?? ""
    )
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as LoginInput | null;
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: firstIssue?.message ?? "Invalid login input.",
        field: firstIssue?.path?.[0],
      },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { message: "Supabase environment variables are not configured." },
      { status: 500 }
    );
  }

  const redirectTo = getLoginRedirectTarget(
    request.nextUrl.searchParams.get("redirect")
  );
  const response = NextResponse.json({ ok: true, redirectTo });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (isInvalidCredentialsError(error)) {
      return NextResponse.json(
        { message: invalidCredentialsMessage },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Login failed." },
      { status: 400 }
    );
  }

  return response;
}
