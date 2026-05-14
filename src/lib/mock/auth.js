import { supabase } from "@/lib/supabase";
import { setRoleCookie, clearRoleCookie } from "@/lib/auth-cookie";

export const AUTH_STORAGE_KEY  = "sellwell:mock-user-id";
export const AUTH_CHANGE_EVENT = "sellwell:auth-change";

// Dev-only role switcher
import { MOCK_USERS, DEFAULT_USER_BY_ROLE } from "./_seed/users";
import { MOCK_PARTNER_PROFILES } from "./_seed/partner-profiles";
import { MOCK_COMPANY_PROFILES } from "./_seed/company-profiles";

const isBrowser = () => typeof window !== "undefined";

function persistUser(authUser) {
  if (!isBrowser()) return;
  if (authUser) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    setRoleCookie(authUser.role);
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    clearRoleCookie();
  }
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function readStoredUser() {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function buildAuthUser(supabaseUser) {
  if (!supabaseUser) return null;
  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", supabaseUser.id).single();
  if (!profile) return null;
  return { id: profile.id, email: supabaseUser.email, role: profile.role,
    is_email_verified: profile.is_email_verified ?? true,
    application_status: profile.application_status,
    application_reviewed_at: profile.application_reviewed_at ?? null,
    application_review_notes: profile.application_review_notes ?? null,
    is_suspended: profile.is_suspended ?? false,
    suspended_at: profile.suspended_at ?? null,
    created_at: profile.created_at, updated_at: profile.updated_at,
    profile };
}

async function uploadFile(file, bucket, userId) {
  if (!file || !(file instanceof File)) return null;
  const safe = file.name.replace(/[^a-z0-9.\-_]/gi, "_").slice(0, 60);
  const path = `${userId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) return null;
  if (bucket === "avatars") {
    return supabase.storage.from(bucket).getPublicUrl(path).data?.publicUrl ?? null;
  }
  return (await supabase.storage.from(bucket).createSignedUrl(path, 3600)).data?.signedUrl ?? null;
}

// ── Auth functions ────────────────────────────────────────────────────────

export async function fetchCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { persistUser(null); return null; }
  const authUser = await buildAuthUser(user);
  persistUser(authUser);
  return authUser;
}

export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;
  const authUser = await buildAuthUser(data.user);
  persistUser(authUser);
  return authUser;
}

export async function logoutUser() {
  await supabase.auth.signOut();
  persistUser(null);
  return null;
}

// Step 1 — called from SignupClient with { email, password }
// Just creates the user. Session is stored by Supabase internally.
// Returns { ok: true } so SignupClient navigates to profile step.
export async function signupPartner({ email, password }) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signupCompany({ email, password }) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Step 2 — called from PartnerProfileClient / CompanyProfileClient
// Reads the session Supabase already stored, upserts the profile.
export async function savePartnerProfile({ firstName, lastName, phone, bio, linkedin, categoryIds, skillIds, photo, cv }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No session" };
  const [photoUrl, cvUrl] = await Promise.all([
    uploadFile(photo ?? null, "avatars", user.id),
    uploadFile(cv    ?? null, "documents", user.id),
  ]);
  await supabase.from("profiles").upsert({
    id: user.id, role: "sales_partner",
    first_name: firstName ?? null, last_name: lastName ?? null,
    phone: phone ?? null, bio: bio ?? null, linkedin_url: linkedin ?? null,
    profile_photo: photoUrl, cv_file: cvUrl,
    categories: categoryIds ?? [], skill_tags: skillIds ?? [],
  }, { onConflict: "id" });
  const authUser = await buildAuthUser(user);
  persistUser(authUser);
  return { ok: true };
}

export async function saveCompanyProfile({ companyName, industryId, website, description, logo }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No session" };
  const logoUrl = await uploadFile(logo ?? null, "avatars", user.id);
  await supabase.from("profiles").upsert({
    id: user.id, role: "company",
    company_name: companyName ?? null, industry: industryId ?? null,
    website: website ?? null, description: description ?? null,
    logo: logoUrl,
  }, { onConflict: "id" });
  const authUser = await buildAuthUser(user);
  persistUser(authUser);
  return { ok: true };
}

export async function requestPasswordReset({ email }) {
  await supabase.auth.resetPasswordForEmail(email);
  return { ok: true };
}

export async function resetPassword({ token, password }) {
  void token;
  const { error } = await supabase.auth.updateUser({ password });
  return { ok: !error };
}

export async function verifyEmail({ token }) {
  void token;
  return { ok: true };
}

// ── Dev-only role switcher ────────────────────────────────────────────────
function buildMockSnapshot(user) {
  if (!user) return null;
  let profile = null;
  if (user.role === "sales_partner") profile = MOCK_PARTNER_PROFILES.find((p) => p.user === user.id) ?? null;
  else if (user.role === "company")   profile = MOCK_COMPANY_PROFILES.find((p) => p.user === user.id) ?? null;
  return { ...user, profile };
}

export function loginAsRole(role) {
  if (!isBrowser()) return null;
  const id = DEFAULT_USER_BY_ROLE[role];
  if (id === undefined) return null;
  const user = MOCK_USERS.find((u) => u.id === id) ?? null;
  if (!user) return null;
  const authUser = buildMockSnapshot(user);
  persistUser(authUser);
  return authUser;
}

export function loginAsUserId(id) {
  if (!isBrowser()) return null;
  const user = MOCK_USERS.find((u) => u.id === id);
  if (!user) return null;
  const authUser = buildMockSnapshot(user);
  persistUser(authUser);
  return authUser;
}

// ── Keep localStorage in sync on token refresh / tab focus ───────────────
if (isBrowser()) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT" || !session) { persistUser(null); return; }
    if (event === "TOKEN_REFRESHED") {
      const authUser = await buildAuthUser(session.user);
      if (authUser) persistUser(authUser);
    }
  });
}
