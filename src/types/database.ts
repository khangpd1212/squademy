export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Run `npx supabase gen types typescript` to generate full types.
// This is a placeholder structure.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          full_name: string | null;
          school: string | null;
          location: string | null;
          age: number | null;
          gdpr_consent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          full_name?: string | null;
          school?: string | null;
          location?: string | null;
          age?: number | null;
          gdpr_consent_at?: string | null;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          full_name?: string | null;
          school?: string | null;
          location?: string | null;
          age?: number | null;
          gdpr_consent_at?: string | null;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          invite_code?: string;
          created_by: string;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          invited_by: string;
          invitee_id: string;
          status: "pending" | "accepted" | "declined";
          created_at: string;
        };
        Insert: {
          group_id: string;
          invited_by: string;
          invitee_id: string;
          status?: "pending" | "accepted" | "declined";
        };
        Update: {
          status?: "pending" | "accepted" | "declined";
        };
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: "admin" | "editor" | "member";
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: "admin" | "editor" | "member";
        };
        Update: {
          role?: "admin" | "editor" | "member";
        };
      };
      lessons: {
        Row: {
          id: string;
          group_id: string;
          author_id: string;
          title: string;
          content: string;
          status: "draft" | "review" | "published";
          editor_feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          group_id: string;
          author_id: string;
          title: string;
          content: string;
          status?: "draft" | "review" | "published";
        };
        Update: {
          title?: string;
          content?: string;
          status?: "draft" | "review" | "published";
          editor_feedback?: string | null;
        };
      };
      exercises: {
        Row: {
          id: string;
          group_id: string;
          lesson_id: string | null;
          type: string;
          payload: Json;
          is_group_challenge: boolean;
          scheduled_at: string | null;
          created_at: string;
        };
        Insert: {
          group_id: string;
          lesson_id?: string | null;
          type: string;
          payload: Json;
          is_group_challenge?: boolean;
          scheduled_at?: string | null;
        };
        Update: {
          type?: string;
          payload?: Json;
          is_group_challenge?: boolean;
          scheduled_at?: string | null;
        };
      };
      exercise_submissions: {
        Row: {
          id: string;
          exercise_id: string;
          user_id: string;
          answers: Json;
          submitted_at: string;
        };
        Insert: {
          exercise_id: string;
          user_id: string;
          answers: Json;
        };
        Update: {
          answers?: Json;
        };
      };
      peer_reviews: {
        Row: {
          id: string;
          submission_id: string;
          reviewer_id: string;
          status: string;
          score: number | null;
          feedback: Json | null;
          reviewed_at: string | null;
        };
        Insert: {
          submission_id: string;
          reviewer_id: string;
          status?: string;
        };
        Update: {
          status?: string;
          score?: number | null;
          feedback?: Json | null;
          reviewed_at?: string | null;
        };
      };
      review_comments: {
        Row: {
          id: string;
          peer_review_id: string;
          user_id: string;
          line_ref: string | null;
          body: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          peer_review_id: string;
          user_id: string;
          line_ref?: string | null;
          body: string;
          parent_id?: string | null;
        };
        Update: {
          body?: string;
        };
      };
      streaks: {
        Row: {
          user_id: string;
          group_id: string;
          current_streak: number;
          last_activity_at: string;
        };
        Insert: {
          user_id: string;
          group_id: string;
          current_streak?: number;
        };
        Update: {
          current_streak?: number;
          last_activity_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
