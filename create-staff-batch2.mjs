/**
 * create-staff.mjs
 *
 * Bulk-creates real login accounts (auth user + profiles row) for Boss.
 * Run locally with the service role key as an env var — NEVER paste that
 * key into chat. Reusable: just edit the STAFF list below for the rest of
 * the 15+ people later.
 *
 * Usage:
 *   cd ~/Downloads/kauvex-boss
 *   SUPABASE_SERVICE_ROLE_KEY="paste-key-here-only-in-terminal" node ~/Downloads/create-staff.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// ---- Read VITE_SUPABASE_URL from the project's .env.local (already pulled via `vercel env`) ----
const envLocal = fs.readFileSync("./.env.local", "utf8");
const urlMatch = envLocal.match(/VITE_SUPABASE_URL=(.+)/);
if (!urlMatch) {
  console.error("Could not find VITE_SUPABASE_URL in .env.local — run this from ~/Downloads/kauvex-boss");
  process.exit(1);
}
const SUPABASE_URL = urlMatch[1].trim();

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY as an env var before running (see usage comment above).");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BIZZEN_COMPANY_ID = "5e8dbe9d-7625-4599-b431-330372cb6c2b"; // Kauzar Academy = Bizzen's own company
const TEMP_PASSWORD = "Bizzen@2026";

// ---- Edit this list to add more people later (batch 2, batch 3, ...) ----
// Batch 1 (Hafsal, Muneefa, Shifana) already created earlier — not repeated here.
const STAFF = [
  { full_name: "Sumayya", email: "sumayyakauzar@gmail.com", role: "sales" },
  { full_name: "Jubeena", email: "jubeenakauzar@gmail.com", role: "hr" },
  { full_name: "Murshida", email: "murshidakauzar@gmail.com", role: "accountant" },
  { full_name: "Rashid", email: "rashidkauzar@gmail.com", role: "marketing_executive" },
  { full_name: "Sabin", email: "Sabinkauzar@gmail.com", role: "marketing_executive" },
  { full_name: "Rishad", email: "rishadkauzarmv@gmail.com", role: "marketing_executive" },
  { full_name: "Hafeef", email: "hafeefkauzar@gmail.com", role: "marketing_executive" },
  { full_name: "Shahadiya", email: "shahadiyakauzar@gmail.com", role: "marketing_executive" },
  { full_name: "Muhammad Anas", email: "anaskauzaracademy@gmail.com", role: "marketing_executive" },
  { full_name: "Jumana", email: "jumanakauzar@gmail.com", role: "operations" },
  { full_name: "Sadeedha", email: "sadeedhakauzar@gmail.com", role: "operations" },
  { full_name: "Nasifa", email: "nasifakauzar@gmail.com", role: "operations" },
  { full_name: "Fathima", email: "fathymakauzar@gmail.com", role: "operations" },
];

async function createOne(person) {
  console.log(`\n--- ${person.full_name} (${person.email}) ---`);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: person.email,
    password: TEMP_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: person.full_name },
  });

  if (createErr || !created?.user) {
    console.error(`  FAILED to create auth user: ${createErr?.message || "unknown error"}`);
    return;
  }
  console.log(`  auth user created: ${created.user.id}`);

  const { error: profErr } = await admin.from("profiles").upsert(
    {
      id: created.user.id,
      full_name: person.full_name,
      role: person.role,
      company_id: BIZZEN_COMPANY_ID,
    },
    { onConflict: "id" }
  );

  if (profErr) {
    console.error(`  FAILED to create profile row: ${profErr.message}`);
    // roll back the orphaned auth user so retries are clean
    await admin.auth.admin.deleteUser(created.user.id);
    console.error(`  rolled back auth user to avoid an orphan.`);
    return;
  }

  console.log(`  profile row created — role: ${person.role}, company_id: ${BIZZEN_COMPANY_ID}`);
  console.log(`  ✅ DONE — login: ${person.email} / ${TEMP_PASSWORD}`);
}

(async () => {
  console.log(`Creating ${STAFF.length} staff account(s)...`);
  for (const person of STAFF) {
    await createOne(person);
  }
  console.log(`\nAll done. Share each person's email + the temp password (${TEMP_PASSWORD}) with them individually.`);
})();
