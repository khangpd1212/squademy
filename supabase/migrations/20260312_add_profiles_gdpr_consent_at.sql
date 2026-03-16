alter table public.profiles
add column if not exists gdpr_consent_at timestamptz;
