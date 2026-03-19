# Squademy — Architecture Diagrams

**Generated from:** architecture.md v2.0
**Date:** 2026-03-17

---

## 1. Database ER Diagram

```mermaid
erDiagram
    %% ============ AUTH & PROFILE ============
    auth_users {
        uuid id PK
        text email
    }

    profiles {
        uuid id PK, FK
        text display_name
        text avatar_url
        text full_name
        text school
        text location
        int age
        timestamptz created_at
    }

    %% ============ GROUPS & MEMBERSHIP ============
    groups {
        uuid id PK
        text name
        text description
        text invite_code UK
        uuid created_by FK
        timestamptz created_at
    }

    group_members {
        uuid group_id PK, FK
        uuid user_id PK, FK
        text role
        timestamptz joined_at
    }

    group_invitations {
        uuid id PK
        uuid group_id FK
        uuid invited_by FK
        uuid invitee_id FK
        text status
        timestamptz created_at
    }

    %% ============ CONTENT — LESSONS ============
    lessons {
        uuid id PK
        uuid group_id FK
        uuid author_id FK
        text title
        jsonb content
        text content_markdown
        text status
        text editor_feedback
        int sort_order
        boolean is_deleted
        timestamptz created_at
        timestamptz updated_at
    }

    review_comments {
        uuid id PK
        uuid lesson_id FK
        uuid user_id FK
        text line_ref
        text body
        uuid parent_id FK
        timestamptz created_at
    }

    lesson_reactions {
        uuid id PK
        uuid lesson_id FK
        uuid user_id FK
        text paragraph_ref
        text reaction_type
        timestamptz created_at
    }

    %% ============ CONTENT — FLASHCARDS ============
    flashcard_decks {
        uuid id PK
        uuid group_id FK
        uuid lesson_id FK
        uuid author_id FK
        text title
        text status
        boolean is_deleted
        timestamptz created_at
    }

    flashcard_cards {
        uuid id PK
        uuid deck_id FK
        text front
        text back
        text pronunciation_ipa
        text audio_url
        text image_url
        text example_sentence
        text_arr tags
        text extra_notes
        int sort_order
        timestamptz created_at
    }

    srs_progress {
        uuid user_id PK, FK
        uuid card_id PK, FK
        float ease_factor
        int interval_days
        int repetitions
        timestamptz next_review_at
        timestamptz last_reviewed_at
    }

    %% ============ EXERCISES & PEER REVIEW ============
    exercises {
        uuid id PK
        uuid group_id FK
        uuid lesson_id FK
        uuid creator_id FK
        text title
        jsonb content
        text type
        text week_cycle
        timestamptz scheduled_at
        timestamptz deadline_at
        boolean is_public
        timestamptz created_at
    }

    exercise_assignments {
        uuid id PK
        uuid exercise_id FK
        uuid assignee_id FK
        text week_cycle
        timestamptz assigned_at
    }

    exercise_submissions {
        uuid id PK
        uuid exercise_id FK
        uuid submitter_id FK
        jsonb answers
        timestamptz submitted_at
    }

    peer_reviews {
        uuid id PK
        uuid submission_id FK
        uuid reviewer_id FK
        text status
        numeric overall_score
        timestamptz reviewed_at
    }

    peer_review_comments {
        uuid id PK
        uuid peer_review_id FK
        text question_ref
        uuid author_id FK
        text body
        text decision
        uuid parent_id FK
        timestamptz created_at
    }

    exercise_disputes {
        uuid id PK
        uuid peer_review_id FK
        text question_ref
        uuid reporter_id FK
        text reason
        text status
        uuid arbiter_id FK
        text arbitration_decision
        timestamptz resolved_at
        timestamptz created_at
    }

    %% ============ GAMIFICATION ============
    streaks {
        uuid user_id PK, FK
        uuid group_id PK, FK
        int current_streak
        int longest_streak
        timestamptz last_activity_at
    }

    weekly_errors {
        uuid user_id PK, FK
        uuid group_id PK, FK
        text week_cycle PK
        int error_count
    }

    badges {
        uuid id PK
        uuid user_id FK
        uuid group_id FK
        text badge_type
        timestamptz awarded_at
    }

    leaderboard {
        uuid group_id PK, FK
        uuid user_id PK, FK
        int total_score
        int week_score
        int rank
        timestamptz updated_at
    }

    %% ============ NOTIFICATIONS ============
    notifications {
        uuid id PK
        uuid recipient_id FK
        text type
        uuid reference_id
        text reference_type
        text body
        boolean is_read
        boolean email_sent
        timestamptz created_at
    }

    %% ============ RELATIONSHIPS ============

    %% Auth & Profile
    auth_users ||--|| profiles : "id → id"

    %% Groups
    profiles ||--o{ groups : "created_by"
    groups ||--o{ group_members : "group_id"
    profiles ||--o{ group_members : "user_id"
    groups ||--o{ group_invitations : "group_id"
    profiles ||--o{ group_invitations : "invited_by"
    profiles ||--o{ group_invitations : "invitee_id"

    %% Lessons
    groups ||--o{ lessons : "group_id"
    profiles ||--o{ lessons : "author_id"
    lessons ||--o{ review_comments : "lesson_id"
    profiles ||--o{ review_comments : "user_id"
    review_comments ||--o{ review_comments : "parent_id (threaded)"
    lessons ||--o{ lesson_reactions : "lesson_id"
    profiles ||--o{ lesson_reactions : "user_id"

    %% Flashcards
    groups ||--o{ flashcard_decks : "group_id"
    lessons ||--o{ flashcard_decks : "lesson_id (optional)"
    profiles ||--o{ flashcard_decks : "author_id"
    flashcard_decks ||--o{ flashcard_cards : "deck_id"
    profiles ||--o{ srs_progress : "user_id"
    flashcard_cards ||--o{ srs_progress : "card_id"

    %% Exercises
    groups ||--o{ exercises : "group_id"
    lessons ||--o{ exercises : "lesson_id (optional)"
    profiles ||--o{ exercises : "creator_id"
    exercises ||--o{ exercise_assignments : "exercise_id"
    profiles ||--o{ exercise_assignments : "assignee_id"
    exercises ||--o{ exercise_submissions : "exercise_id"
    profiles ||--o{ exercise_submissions : "submitter_id"

    %% Peer Review
    exercise_submissions ||--o{ peer_reviews : "submission_id"
    profiles ||--o{ peer_reviews : "reviewer_id"
    peer_reviews ||--o{ peer_review_comments : "peer_review_id"
    profiles ||--o{ peer_review_comments : "author_id"
    peer_review_comments ||--o{ peer_review_comments : "parent_id (threaded)"
    peer_reviews ||--o{ exercise_disputes : "peer_review_id"
    profiles ||--o{ exercise_disputes : "reporter_id"
    profiles ||--o{ exercise_disputes : "arbiter_id"

    %% Gamification
    profiles ||--o{ streaks : "user_id"
    groups ||--o{ streaks : "group_id"
    profiles ||--o{ weekly_errors : "user_id"
    groups ||--o{ weekly_errors : "group_id"
    profiles ||--o{ badges : "user_id"
    groups ||--o{ badges : "group_id"
    profiles ||--o{ leaderboard : "user_id"
    groups ||--o{ leaderboard : "group_id"

    %% Notifications
    profiles ||--o{ notifications : "recipient_id"
```

---

## 2. System Architecture Diagram

```mermaid
graph TB
    subgraph Client["Client (Browser / Mobile)"]
        NextApp["Next.js App Router<br/>React + TypeScript"]
        Tailwind["Tailwind CSS v4 + shadcn/ui"]
        Zustand["Zustand<br/>(UI State)"]
        RQ["TanStack Query<br/>(Server State)"]
        Tiptap["Tiptap Editor<br/>(Lessons/Exercises)"]
        Framer["Framer Motion<br/>(Animations)"]
        Dexie["Dexie.js<br/>(IndexedDB / Offline)"]
    end

    subgraph Vercel["Next.js Server (Vercel Free)"]
        API_Auth["/api/auth/callback"]
        API_Files["/api/files/upload<br/>/api/files/signed-url"]
        API_Cron["/api/cron/*<br/>weekly-shuffle, reminders"]
        API_Export["/api/export/user-data"]
        Proxy["proxy.ts<br/>(Session + Admin Guard)"]
    end

    subgraph Supabase["Supabase (Free Tier)"]
        Postgres["PostgreSQL + RLS"]
        Auth["Supabase Auth<br/>(Email + Google OAuth)"]
        Realtime["Realtime<br/>(postgres_changes)"]
        EdgeFn["Edge Functions<br/>(optional email)"]
    end

    subgraph External["External Services"]
        R2["Cloudflare R2<br/>(Files: audio, images)"]
        CDN["Cloudflare CDN<br/>(Static assets)"]
        Email["Resend / Brevo<br/>(Transactional email)"]
    end

    %% Client connections
    NextApp --> RQ
    NextApp --> Zustand
    NextApp --> Tiptap
    NextApp --> Framer
    NextApp --> Dexie

    %% Client to Supabase (direct)
    RQ -- "anon key + RLS" --> Postgres
    NextApp -- "Auth session" --> Auth
    NextApp -- "WebSocket" --> Realtime

    %% Client to Vercel API
    NextApp -- "HTTPS" --> API_Auth
    NextApp -- "Upload" --> API_Files
    NextApp -- "Export" --> API_Export

    %% Vercel to external
    API_Files -- "S3 SDK" --> R2
    API_Cron -- "service_role" --> Postgres
    API_Cron --> Email
    Proxy --> Auth

    %% Supabase internal
    EdgeFn --> Email

    %% CDN
    CDN -- "Static JS/CSS/Images" --> Client

    style Client fill:#1e1b4b,color:#e0e7ff
    style Vercel fill:#064e3b,color:#d1fae5
    style Supabase fill:#78350f,color:#fef3c7
    style External fill:#1e3a5f,color:#bfdbfe
```

---

## 3. Data Flow — Content Loop

```mermaid
flowchart LR
    subgraph ContentLoop["Content Loop (Lesson Contribution)"]
        A["Author<br/>(member)"] -->|"Write lesson<br/>Tiptap editor"| B["lessons<br/>status: draft"]
        B -->|"Submit for review"| C["lessons<br/>status: review"]
        C -->|"Editor reviews"| D{Decision}
        D -->|"Approve"| E["lessons<br/>status: published"]
        D -->|"Reject + feedback"| F["lessons<br/>status: rejected"]
        F -->|"Revise & resubmit"| C
        E -->|"Visible in<br/>Learning Path"| G["Group Members<br/>can read"]
    end

    style ContentLoop fill:#0f172a,color:#e2e8f0
```

---

## 4. Data Flow — Practice Loop (Exercise Lifecycle)

```mermaid
flowchart TD
    subgraph WeekCycle["Weekly Exercise Cycle"]
        M["Monday<br/>Cron: weekly-start"] -->|"Notify members"| A
        A["Members create<br/>exercises"] -->|"Submit by Saturday"| B["exercises table<br/>week_cycle: 2026-W11"]
        B -->|"Saturday 23:59<br/>Cron: weekly-shuffle"| C["Derangement<br/>Shuffle Algorithm"]
        C -->|"exercise_assignments"| D["Each member gets<br/>1 peer exercise"]
        D -->|"Complete & submit"| E["exercise_submissions"]
        E -->|"Creator grades"| F["peer_reviews<br/>+ peer_review_comments"]
        F -->|"Dispute?"| G{Agree?}
        G -->|"Yes"| H["Score recorded<br/>leaderboard updated"]
        G -->|"No"| I["exercise_disputes<br/>Editor arbitrates"]
        I --> H
        H -->|"Sunday 23:59<br/>Cron: weekly-close"| J["exercises.is_public = true<br/>Badges awarded"]
    end

    style WeekCycle fill:#0f172a,color:#e2e8f0
```

---

## 5. Data Flow — Flashcard Offline-First

```mermaid
flowchart TD
    A["User opens deck"] --> B{First time?}
    B -->|"Yes"| C["Fetch from Supabase<br/>flashcard_cards"]
    C --> D["Store in Dexie.js<br/>(IndexedDB)"]
    B -->|"No"| D
    D --> E["Practice session<br/>(fully offline capable)"]
    E --> F["Grade card<br/>(SM-2 algorithm)"]
    F --> G{Online?}
    G -->|"Yes"| H["POST srs_progress<br/>to Supabase"]
    G -->|"No"| I["Queue in Dexie<br/>gradeQueue"]
    I -->|"On reconnect"| J["sync.ts flushes<br/>queue to Supabase"]
    J --> H

    style A fill:#7c3aed,color:#fff
    style E fill:#7c3aed,color:#fff
```

---

## 6. Database Tables by Domain

```mermaid
graph TB
    subgraph Auth["Auth & Profile"]
        auth_users["auth.users"]
        profiles["profiles"]
    end

    subgraph Groups["Groups & Membership"]
        groups["groups"]
        group_members["group_members"]
        group_invitations["group_invitations"]
    end

    subgraph Lessons["Content — Lessons"]
        lessons["lessons"]
        review_comments["review_comments"]
        lesson_reactions["lesson_reactions"]
    end

    subgraph Flashcards["Content — Flashcards"]
        flashcard_decks["flashcard_decks"]
        flashcard_cards["flashcard_cards"]
        srs_progress["srs_progress"]
    end

    subgraph Exercises["Exercises & Peer Review"]
        exercises["exercises"]
        exercise_assignments["exercise_assignments"]
        exercise_submissions["exercise_submissions"]
        peer_reviews["peer_reviews"]
        peer_review_comments["peer_review_comments"]
        exercise_disputes["exercise_disputes"]
    end

    subgraph Gamification["Gamification"]
        streaks["streaks"]
        weekly_errors["weekly_errors"]
        badges["badges"]
        leaderboard["leaderboard"]
    end

    subgraph Notifications_Domain["Notifications"]
        notifications["notifications"]
    end

    %% Cross-domain links
    auth_users --> profiles
    profiles --> groups
    profiles --> group_members
    groups --> group_members
    groups --> lessons
    groups --> flashcard_decks
    groups --> exercises
    lessons --> flashcard_decks
    lessons --> exercises
    exercises --> exercise_assignments
    exercises --> exercise_submissions
    exercise_submissions --> peer_reviews
    peer_reviews --> peer_review_comments
    peer_reviews --> exercise_disputes
    profiles --> notifications

    style Auth fill:#4c1d95,color:#ede9fe
    style Groups fill:#065f46,color:#d1fae5
    style Lessons fill:#92400e,color:#fef3c7
    style Flashcards fill:#1e40af,color:#dbeafe
    style Exercises fill:#9f1239,color:#ffe4e6
    style Gamification fill:#a16207,color:#fef9c3
    style Notifications_Domain fill:#475569,color:#f1f5f9
```

---

## 7. Deployment Architecture

```mermaid
graph LR
    subgraph User["End User"]
        Browser["Browser / Mobile"]
    end

    subgraph Edge["Cloudflare Edge"]
        CDN["CDN<br/>(JS, CSS, Images)"]
        R2["R2 Storage<br/>(Audio, Avatars, Exports)"]
    end

    subgraph Compute["Vercel"]
        SSR["SSR / RSC"]
        Routes["API Routes"]
        Cron["Cron Jobs<br/>(4 schedules)"]
    end

    subgraph Data["Supabase"]
        PG["PostgreSQL<br/>(20 tables + RLS)"]
        AuthSvc["Auth Service"]
        RT["Realtime<br/>(3 channels)"]
    end

    subgraph Mail["Email"]
        Resend["Resend / Brevo"]
    end

    Browser -->|"Static"| CDN
    Browser -->|"SSR + API"| Compute
    Browser -->|"Direct query<br/>(anon key)"| PG
    Browser -->|"WebSocket"| RT
    Routes -->|"S3 SDK"| R2
    Cron -->|"service_role"| PG
    Cron --> Resend
    SSR --> AuthSvc

    style User fill:#1e1b4b,color:#e0e7ff
    style Edge fill:#1e3a5f,color:#bfdbfe
    style Compute fill:#064e3b,color:#d1fae5
    style Data fill:#78350f,color:#fef3c7
    style Mail fill:#475569,color:#f1f5f9
```
