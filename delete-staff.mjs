/**
 * delete-staff.mjs
 *
 * Completely deletes the given user(s) — auth login + profile row.
 * Run locally with the service role key as an env var — NEVER paste that
 * key into chat.
 *
 * Usage:
 *   cd ~/Downloads/kauvex-boss
 *   SUPABASE_URL="https://lnwtokugtdneyeyppnsj.supabase.co" SUPABASE_SERVICE_ROLE_KEY="paste-key-here-only-in-terminal" node delete-staff.mjs
 */

import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// Node 18/20 don't have a native WebSocket global, which supabase-js's
// realtime client needs even if you never use realtime features.
globalThis.WebSocket = WebSocket;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as env vars before running.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---- Confirmed IDs to delete ----
const TO_DELETE = [
  { full_name: "Jumana", id: "01ddc41f-433b-415f-b9c7-b6e05cb793a1" },
  { full_name: "Nasifa", id: "88925f18-9437-43f4-9a8a-291bf41716a9" },
];

async function deleteOne(person) {
  console.log(`\n--- ${person.full_name} (${person.id}) ---`);

  // Delete the profile row first (in case there's no cascading FK from auth.users).
  const { error: profErr } = await admin.from("profiles").delete().eq("id", person.id);
  if (profErr) {
    console.error(`  FAILED to delete profile row: ${profErr.message}`);
    return;
  }
  console.log(`  profile row deleted`);

  const { error: authErr } = await admin.auth.admin.deleteUser(person.id);
  if (authErr) {
    console.error(`  FAILED to delete auth login: ${authErr.message}`);
    return;
  }
  console.log(`  \u2705 auth login deleted \u2014 fully removed`);
}

(async () => {
  console.log(`Deleting ${TO_DELETE.length} account(s)...`);
  for (const person of TO_DELETE) {
    await deleteOne(person);
  }
  console.log(`\nDone.`);
})();
