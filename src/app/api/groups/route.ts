import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import {
  createGroupSchema,
  toNullableDescription,
  type CreateGroupInput,
} from "./group-schema";

type GroupsInsert = Database["public"]["Tables"]["groups"]["Insert"];
type GroupMembersInsert = Database["public"]["Tables"]["group_members"]["Insert"];

type GroupsTableClient = {
  from: (table: "groups") => {
    insert: (values: GroupsInsert) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: Database["public"]["Tables"]["groups"]["Row"] | null;
          error: { code?: string; message?: string } | null;
        }>;
      };
    };
    delete: () => {
      eq: (column: "id", value: string) => Promise<{
        error: { message?: string } | null;
      }>;
    };
  };
};

type GroupMembersTableClient = {
  from: (table: "group_members") => {
    insert: (values: GroupMembersInsert) => Promise<{
      error: { message?: string } | null;
    }>;
  };
};

let inviteCodeGenerator: (() => string) | null = null;

async function getInviteCodeGenerator() {
  if (inviteCodeGenerator) {
    return inviteCodeGenerator;
  }

  const { customAlphabet } = await import("nanoid");
  inviteCodeGenerator = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);
  return inviteCodeGenerator;
}

function isInviteCodeConflict(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  if (error.code !== "23505") {
    return false;
  }

  return /invite_code/i.test(error.message ?? "");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreateGroupInput | null;
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: issue?.message ?? "Invalid group input.",
        field: issue?.path?.[0],
      },
      { status: 400 }
    );
  }

  const groupsTable = (supabase as unknown as GroupsTableClient).from("groups");
  const groupMembersTable = (supabase as unknown as GroupMembersTableClient).from(
    "group_members"
  );
  const generateInviteCode = await getInviteCodeGenerator();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const inviteCode = generateInviteCode();
    const { data: group, error: insertGroupError } = await groupsTable
      .insert({
        name: parsed.data.name.trim(),
        description: toNullableDescription(parsed.data.description),
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select("id,name,invite_code,description")
      .single();

    if (insertGroupError) {
      if (isInviteCodeConflict(insertGroupError) && attempt < 2) {
        continue;
      }

      return NextResponse.json({ message: "Could not create group." }, { status: 500 });
    }

    if (!group) {
      return NextResponse.json({ message: "Could not create group." }, { status: 500 });
    }

    const { error: insertMemberError } = await groupMembersTable.insert({
      group_id: group.id,
      user_id: user.id,
      role: "admin",
    });

    if (insertMemberError) {
      await groupsTable.delete().eq("id", group.id);
      return NextResponse.json(
        { message: "Could not initialize group membership." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        group: {
          id: group.id,
          name: group.name,
          inviteCode: group.invite_code,
        },
      },
      { status: 201 }
    );
  }

  return NextResponse.json({ message: "Could not create group." }, { status: 500 });
}
