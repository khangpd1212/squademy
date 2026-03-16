import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  duplicateEmailMessage,
  registerSchema,
} from "@/app/(auth)/register/register-schema";

type RegisterPayload = {
  email: string;
  password: string;
  displayName: string;
  acceptPrivacy: boolean;
};

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    return configured;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RegisterPayload | null;
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: firstIssue?.message ?? "Invalid registration input.",
        field: firstIssue?.path?.[0],
      },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRole) {
    return NextResponse.json(
      { message: "Supabase environment variables are not configured." },
      { status: 500 }
    );
  }

  const consentAt = new Date().toISOString();
  const baseUrl = getBaseUrl(request);
  const adminClient = createClient(supabaseUrl, serviceRole);

  // Preflight schema compatibility before creating an auth user.
  const { error: schemaError } = await adminClient
    .from("profiles")
    .select("id, gdpr_consent_at")
    .limit(1);

  if (schemaError) {
    return NextResponse.json(
      {
        message:
          "Registration is temporarily unavailable. Please run pending database migrations.",
      },
      { status: 500 }
    );
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await authClient.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
        gdpr_consent_at: consentAt,
      },
      emailRedirectTo: `${baseUrl}/login`,
    },
  });

  if (error) {
    if (
      error.code === "user_already_exists" ||
      error.code === "email_exists" ||
      /already registered|already exists/i.test(error.message)
    ) {
      return NextResponse.json(
        {
          field: "email",
          message: duplicateEmailMessage,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Registration failed." },
      { status: 400 }
    );
  }

  if (!data.user?.id) {
    return NextResponse.json(
      { message: "Registration failed. Missing user id." },
      { status: 500 }
    );
  }
  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: data.user.id,
      display_name: parsed.data.displayName,
      gdpr_consent_at: consentAt,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    // Best-effort rollback to avoid partial success (auth user without profile/consent data).
    await adminClient.auth.admin.deleteUser(data.user.id);

    return NextResponse.json(
      { message: "Registration failed during profile setup. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    redirectTo: `/register/check-email?email=${encodeURIComponent(parsed.data.email)}`,
  });
}
