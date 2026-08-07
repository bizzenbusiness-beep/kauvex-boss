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
import WebSocket from "ws";

// Node 18/20 don't have a native WebSocket global, which supabase-js's
// realtime client needs even if you never use realtime features. Polyfill it.
globalThis.WebSocket = WebSocket;

// ---- Get the Supabase URL: prefer an explicit SUPABASE_URL env var,
// fall back to reading .env.local (works even if the .env.local value was
// masked as "[SENSITIVE]" by `vercel env pull`) ----
let SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
  const envLocal = fs.readFileSync("./.env.local", "utf8");
  const urlMatch = envLocal.match(/VITE_SUPABASE_URL=(.+)/);
  if (!urlMatch || urlMatch[1].includes("SENSITIVE")) {
    console.error("Could not find a usable VITE_SUPABASE_URL — pass it directly: SUPABASE_URL=... node create-staff-batch2.mjs");
    process.exit(1);
  }
  SUPABASE_URL = urlMatch[1].trim().replace(/^["']|["']$/g, "");
}

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

// ---- Remaining people only (2e2b1 batch fixed constraint issue) ----
// 9 people already created successfully in the previous run — not repeated here.
const STAFF = [
  { full_name: "Hafsal", email: "hafsalkauzar@gmail.com", role: "sales" },
  { full_name: "Muneefa", email: "muneefakauzar@gmail.com", role: "sales" },
  { full_name: "Shifana", email: "hrmkauzaracademy@gmail.com", role: "hr_manager" },
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
