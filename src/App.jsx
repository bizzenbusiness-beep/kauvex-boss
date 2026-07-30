import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutGrid, Users, Activity, Gauge, TrendingUp,
  Plus, Circle, Clock, CheckCircle2, ChevronRight, Building2,
  LogOut, Lock, Loader2, AlertCircle, FileText
} from "lucide-react";
import { supabase } from "./lib/supabaseClient.js";
import FormsModule from "./forms/FormsModule.jsx";

/* ---------------------------------------------------------
   KAUVEX OPS — internal command-center for BOSS BMW rollouts
   Design language: "site blueprint" — steel-blue + safety amber,
   corner tick-marks like architectural drawings, mono data type.
--------------------------------------------------------- */

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
`;

const COLORS = {
  ink: "#132530",
  paper: "#EEF1F0",
  card: "#FFFFFF",
  blueprint: "#2C5F7C",
  amber: "#E8A23D",
  slate: "#5B6B76",
  green: "#3E8E5C",
  red: "#C1483D",
  line: "#D9DEDC",
};

function CornerFrame({ children, accent = COLORS.blueprint, style = {} }) {
  return (
    <div style={{ position: "relative", ...style }}>
      {["tl", "tr", "bl", "br"].map((pos) => (
        <span
          key={pos}
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderColor: accent,
            borderStyle: "solid",
            borderWidth: 0,
            ...(pos === "tl" && { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 }),
            ...(pos === "tr" && { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 }),
            ...(pos === "bl" && { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 }),
            ...(pos === "br" && { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 }),
          }}
        />
      ))}
      {children}
    </div>
  );
}

function KpiTile({ label, value, unit, delta, accent }) {
  const up = delta >= 0;
  return (
    <CornerFrame accent={accent} style={{ background: COLORS.card, padding: "18px 20px", flex: 1, minWidth: 180 }}>
      <div style={{ fontFamily: "Inter", fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: COLORS.slate, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "IBM Plex Mono", fontSize: 30, fontWeight: 500, color: COLORS.ink }}>{value}</span>
        {unit && <span style={{ fontFamily: "IBM Plex Mono", fontSize: 14, color: COLORS.slate }}>{unit}</span>}
      </div>
      <div style={{ fontFamily: "IBM Plex Mono", fontSize: 12, marginTop: 8, color: up ? COLORS.green : COLORS.red }}>
        {up ? "▲" : "▼"} {Math.abs(delta)}% vs last month
      </div>
    </CornerFrame>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: "IBM Plex Mono", fontSize: 11, letterSpacing: 1.5, color: COLORS.amber, textTransform: "uppercase", marginBottom: 4 }}>
        {eyebrow}
      </div>
      <h2 style={{ fontFamily: "Space Grotesk", fontSize: 24, fontWeight: 600, color: COLORS.ink, margin: 0 }}>{title}</h2>
    </div>
  );
}

/* ---------------- PROJECT COORDINATION ---------------- */
function ProjectCoordination({ companyId }) {
  const [projectId, setProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true })
        .limit(1);
      let pid = projects && projects[0] ? projects[0].id : null;
      if (!pid) {
        const { data: created } = await supabase
          .from("projects")
          .insert({ company_id: companyId, name: "General Board", status: "active" })
          .select()
          .single();
        pid = created ? created.id : null;
      }
      if (cancelled) return;
      setProjectId(pid);
      if (pid) {
        const { data: taskRows } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", pid)
          .order("created_at", { ascending: true });
        if (!cancelled) setTasks(taskRows || []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  async function addTask() {
    if (!draft.trim() || !projectId) return;
    const { data: created } = await supabase
      .from("tasks")
      .insert({ project_id: projectId, title: draft.trim(), status: "todo" })
      .select()
      .single();
    if (created) setTasks((t) => [...t, created]);
    setDraft("");
  }

  async function cycleStatus(task) {
    const order = ["todo", "progress", "done"];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    await supabase.from("tasks").update({ status: next, updated_at: new Date().toISOString() }).eq("id", task.id);
  }

  const colMeta = [
    { key: "todo", label: "To Do", accent: COLORS.slate, icon: Circle },
    { key: "progress", label: "In Progress", accent: COLORS.amber, icon: Clock },
    { key: "done", label: "Done", accent: COLORS.green, icon: CheckCircle2 },
  ];

  return (
    <div>
      <SectionHeading eyebrow="Module 01" title="Project Coordination" />
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task — e.g. Site visit, Palakkad"
          style={{
            flex: 1, padding: "10px 14px", border: `1px solid ${COLORS.line}`,
            fontFamily: "Inter", fontSize: 14, background: COLORS.card, borderRadius: 2,
          }}
        />
        <button
          onClick={addTask}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
            background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2,
            fontFamily: "Inter", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          <Plus size={15} /> Add
        </button>
      </div>

      {loading ? (
        <div style={{ color: COLORS.slate, fontSize: 13 }}>Loading tasks...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {colMeta.map(({ key, label, accent, icon: Icon }) => {
            const colTasks = tasks.filter((t) => t.status === key);
            return (
              <div key={key}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Icon size={14} color={accent} />
                  <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: accent }}>
                    {label} · {colTasks.length}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {colTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => cycleStatus(t)}
                      title="Click to move to next status"
                      style={{
                        background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${accent}`,
                        padding: "10px 12px", fontFamily: "Inter", fontSize: 13.5, color: COLORS.ink, borderRadius: 2,
                        textAlign: "left", cursor: "pointer",
                      }}
                    >
                      {t.title}
                    </button>
                  ))}
                  {colTasks.length === 0 && (
                    <div style={{ fontFamily: "Inter", fontSize: 12.5, color: COLORS.slate, fontStyle: "italic" }}>Nothing here yet</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- HR ---------------- */
function HRModule() {
  const team = [
    { name: "Navas", role: "Owner", happiness: 8, value: "Vision & client trust" },
    { name: "Structural Engineer", role: "Design", happiness: 7, value: "Drawing accuracy" },
    { name: "Project Manager", role: "Execution", happiness: 6, value: "Site coordination" },
    { name: "Site Supervisor", role: "Execution", happiness: 7, value: "Daily site control" },
    { name: "Accountant", role: "Finance", happiness: 8, value: "Cash-flow discipline" },
    { name: "Digital Marketing", role: "Marketing", happiness: 6, value: "Lead visibility" },
  ];
  return (
    <div>
      <SectionHeading eyebrow="Module 02" title="HR & Team Happiness" />
      <CornerFrame accent={COLORS.blueprint} style={{ background: COLORS.card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Inter" }}>
          <thead>
            <tr style={{ background: COLORS.ink }}>
              {["Name", "Role", "Happiness", "Value Created"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: "#fff", fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.map((t, i) => (
              <tr key={t.name} style={{ borderTop: `1px solid ${COLORS.line}`, background: i % 2 ? "#FAFBFA" : "#fff" }}>
                <td style={{ padding: "10px 14px", fontSize: 13.5, color: COLORS.ink, fontWeight: 500 }}>{t.name}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: COLORS.slate }}>{t.role}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 70, height: 6, background: COLORS.line, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${t.happiness * 10}%`, height: "100%", background: t.happiness >= 7 ? COLORS.green : COLORS.amber }} />
                    </div>
                    <span style={{ fontFamily: "IBM Plex Mono", fontSize: 12, color: COLORS.slate }}>{t.happiness}/10</span>
                  </div>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: COLORS.slate }}>{t.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CornerFrame>
    </div>
  );
}

/* ---------------- ACTIVITY ---------------- */
function ActivityModule({ companyId, profile }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);
  const [posting, setPosting] = useState(false);

  const tagColor = { "Check-in": COLORS.green, "Check-out": COLORS.red, Task: COLORS.blueprint, Finance: COLORS.amber, Marketing: COLORS.slate, "Workflow Log": COLORS.blueprint };

  async function loadLogs() {
    if (!companyId) return;
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("company_id", companyId)
      .eq("log_date", today)
      .order("log_time", { ascending: false })
      .limit(30);
    setLogs(data || []);
    if (data) {
      const mine = data.filter((d) => d.description && d.description.includes(profile.full_name));
      const lastCheckIn = mine.find((d) => d.activity_type === "Check-in");
      const lastCheckOut = mine.find((d) => d.activity_type === "Check-out");
      setCheckedIn(!!lastCheckIn && (!lastCheckOut || new Date(lastCheckIn.created_at) > new Date(lastCheckOut.created_at)));
    }
    setLoading(false);
  }

  useEffect(() => { loadLogs(); /* eslint-disable-next-line */ }, [companyId]);

  async function postLog(activity_type, description) {
    if (!companyId) return;
    setPosting(true);
    const now = new Date();
    await supabase.from("activity_logs").insert({
      company_id: companyId,
      activity_type,
      description,
      log_date: now.toISOString().slice(0, 10),
      log_time: now.toTimeString().slice(0, 8),
    });
    setPosting(false);
    loadLogs();
  }

  function handleCheckIn() {
    postLog("Check-in", `${profile.full_name} checked in`);
  }
  function handleCheckOut() {
    postLog("Check-out", `${profile.full_name} checked out`);
  }
  function handleSubmitLog() {
    if (!note.trim()) return;
    postLog("Task", `${profile.full_name} — ${note.trim()}`);
    setNote("");
  }

  return (
    <div>
      <SectionHeading eyebrow="Module 03" title="Activity Log" />

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={handleCheckIn}
          disabled={checkedIn || posting}
          style={{
            padding: "9px 16px", borderRadius: 2, border: "none", cursor: checkedIn ? "default" : "pointer",
            background: checkedIn ? COLORS.line : COLORS.green, color: checkedIn ? COLORS.slate : "#fff",
            fontFamily: "Inter", fontWeight: 600, fontSize: 13,
          }}
        >
          {checkedIn ? "Checked In ✓" : "Check In"}
        </button>
        <button
          onClick={handleCheckOut}
          disabled={!checkedIn || posting}
          style={{
            padding: "9px 16px", borderRadius: 2, border: `1px solid ${COLORS.red}`, cursor: !checkedIn ? "default" : "pointer",
            background: "#fff", color: !checkedIn ? COLORS.line : COLORS.red,
            fontFamily: "Inter", fontWeight: 600, fontSize: 13,
          }}
        >
          Check Out
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmitLog()}
          placeholder="Log a task / workflow update — e.g. Reviewed steel delivery schedule"
          style={{ flex: 1, padding: "10px 14px", border: `1px solid ${COLORS.line}`, fontFamily: "Inter", fontSize: 14, background: COLORS.card, borderRadius: 2 }}
        />
        <button
          onClick={handleSubmitLog}
          disabled={posting}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2, fontFamily: "Inter", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          <Plus size={15} /> Submit
        </button>
      </div>

      {loading ? (
        <div style={{ color: COLORS.slate, fontSize: 13 }}>Loading today's log...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {logs.map((l, i) => (
            <div key={l.id || i} style={{ display: "flex", gap: 16, padding: "12px 0", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
              <div style={{ fontFamily: "IBM Plex Mono", fontSize: 12.5, color: COLORS.slate, width: 60 }}>{(l.log_time || "").slice(0, 5)}</div>
              <div style={{
                fontFamily: "IBM Plex Mono", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5,
                color: "#fff", background: tagColor[l.activity_type] || COLORS.slate, padding: "2px 8px", borderRadius: 2, height: 18, width: 86, textAlign: "center",
              }}>
                {l.activity_type}
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 13.5, color: COLORS.ink, flex: 1 }}>{l.description}</div>
            </div>
          ))}
          {logs.length === 0 && <div style={{ fontSize: 13, color: COLORS.slate, fontStyle: "italic" }}>No activity logged today yet.</div>}
        </div>
      )}
    </div>
  );
}

/* ---------------- MEASURE & MONITOR ---------------- */
function MeasureMonitor() {
  const funcs = [
    { name: "Marketing", target: 40, actual: 27 },
    { name: "Sales", target: 12, actual: 8 },
    { name: "Operations", target: 90, actual: 76 },
    { name: "Accounts", target: 100, actual: 94 },
  ];
  return (
    <div>
      <SectionHeading eyebrow="Module 04" title="Measure & Monitor" />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
        <KpiTile label="Leads Generated" value="27" delta={12} accent={COLORS.blueprint} />
        <KpiTile label="Conversion Rate" value="19.4" unit="%" delta={-3} accent={COLORS.amber} />
        <KpiTile label="Revenue MTD" value="8.4L" delta={6} accent={COLORS.green} />
        <KpiTile label="Team Score" value="7.1" unit="/10" delta={4} accent={COLORS.blueprint} />
      </div>

      <div style={{ fontFamily: "IBM Plex Mono", fontSize: 11, letterSpacing: 0.8, color: COLORS.slate, textTransform: "uppercase", marginBottom: 12 }}>
        Target vs Actual — This Month
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {funcs.map((f) => (
          <div key={f.name}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter", fontSize: 13, color: COLORS.ink, marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{f.name}</span>
              <span style={{ fontFamily: "IBM Plex Mono", color: COLORS.slate }}>{f.actual} / {f.target}</span>
            </div>
            <div style={{ height: 8, background: COLORS.line, borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                width: `${Math.min(100, (f.actual / f.target) * 100)}%`, height: "100%",
                background: f.actual / f.target >= 0.85 ? COLORS.green : COLORS.amber,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- IMPROVEMENT CALCULATION ---------------- */
function ImprovementCalc() {
  const [before, setBefore] = useState(30);
  const [after, setAfter] = useState(48);
  const improvement = useMemo(() => {
    if (!before) return 0;
    return (((after - before) / before) * 100).toFixed(1);
  }, [before, after]);
  const positive = after >= before;

  return (
    <div>
      <SectionHeading eyebrow="Module 05" title="Improvement Calculation" />
      <CornerFrame accent={COLORS.blueprint} style={{ background: COLORS.card, padding: 24, maxWidth: 480 }}>
        <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
          <label style={{ flex: 1 }}>
            <div style={{ fontFamily: "Inter", fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>Before (baseline)</div>
            <input
              type="number" value={before} onChange={(e) => setBefore(Number(e.target.value))}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.line}`, fontFamily: "IBM Plex Mono", fontSize: 16, borderRadius: 2 }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <div style={{ fontFamily: "Inter", fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>After (current)</div>
            <input
              type="number" value={after} onChange={(e) => setAfter(Number(e.target.value))}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.line}`, fontFamily: "IBM Plex Mono", fontSize: 16, borderRadius: 2 }}
            />
          </label>
        </div>
        <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 16, display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "Inter", fontSize: 13, color: COLORS.slate }}>Improvement</span>
          <span style={{ fontFamily: "Space Grotesk", fontSize: 32, fontWeight: 700, color: positive ? COLORS.green : COLORS.red }}>
            {positive ? "+" : ""}{improvement}%
          </span>
        </div>
        <div style={{ fontFamily: "Inter", fontSize: 12, color: COLORS.slate, marginTop: 8 }}>
          Use this for any metric — leads, revenue, conversion rate, productive hours — to show progress at review time.
        </div>
      </CornerFrame>
    </div>
  );
}

/* ---------------- ROLE LABELS ---------------- */
const ROLE_LABELS = {
  kauvex_owner: "Kauvex Owner",
  kauvex_admin: "Kauvex Admin",
  kauvex_team: "Kauvex Team",
  client_leader: "Leader",
  client_admin: "Admin",
  client_team: "Team",
};
const KAUVEX_ROLES = ["kauvex_owner", "kauvex_admin", "kauvex_team"];

/* ---------------- LOGIN SCREEN ---------------- */
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.ink, fontFamily: "Inter",
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    }}>
      <style>{FONT_IMPORT}</style>
      <CornerFrame accent={COLORS.amber} style={{ background: COLORS.card, padding: "36px 34px", width: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
          <Building2 color={COLORS.blueprint} size={22} />
          <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 20, color: COLORS.ink }}>KAUVEX</span>
          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: COLORS.amber, marginLeft: 2 }}>OPS</span>
        </div>
        <div style={{ fontFamily: "IBM Plex Mono", fontSize: 11, letterSpacing: 0.8, color: COLORS.slate, textTransform: "uppercase", marginBottom: 20 }}>
          Sign in to your workspace
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>Email</div>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontFamily: "Inter", fontSize: 14, boxSizing: "border-box" }}
            />
          </label>
          <label style={{ display: "block", marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>Password</div>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontFamily: "Inter", fontSize: 14, boxSizing: "border-box" }}
            />
          </label>

          {error && (
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start", background: "#FBEAE8", border: `1px solid ${COLORS.red}`, padding: "8px 10px", borderRadius: 2, marginBottom: 16 }}>
              <AlertCircle size={14} color={COLORS.red} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: COLORS.red }}>{error}</span>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px 16px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2,
              fontFamily: "Inter", fontWeight: 600, fontSize: 14, cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <Loader2 size={15} className="spin" /> : <Lock size={14} />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ fontFamily: "Inter", fontSize: 11.5, color: COLORS.slate, marginTop: 18, lineHeight: 1.5 }}>
          Accounts are created by invite only. If you don't have one yet,
          contact your Kauvex admin.
        </div>
      </CornerFrame>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ---------------- NO PROFILE / PENDING ACCESS SCREEN ---------------- */
function PendingAccess({ email, onSignOut }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.paper, fontFamily: "Inter", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{FONT_IMPORT}</style>
      <CornerFrame accent={COLORS.amber} style={{ background: COLORS.card, padding: "32px 30px", width: 380, textAlign: "center" }}>
        <Lock size={22} color={COLORS.amber} style={{ marginBottom: 12 }} />
        <div style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 17, color: COLORS.ink, marginBottom: 8 }}>
          Access pending
        </div>
        <div style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.6, marginBottom: 20 }}>
          You're signed in as <strong>{email}</strong>, but no workspace role
          has been assigned to this account yet. Ask your Kauvex admin to add
          you.
        </div>
        <button
          onClick={onSignOut}
          style={{ padding: "9px 18px", background: "transparent", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontFamily: "Inter", fontSize: 13, color: COLORS.ink, cursor: "pointer" }}
        >
          Sign out
        </button>
      </CornerFrame>
    </div>
  );
}

/* ---------------- SHELL ---------------- */
const NAV = [
  { key: "coord", label: "Project Coordination", icon: LayoutGrid, Comp: ProjectCoordination },
  { key: "hr", label: "HR", icon: Users, Comp: HRModule },
  { key: "activity", label: "Activity", icon: Activity, Comp: ActivityModule },
  { key: "measure", label: "Measure & Monitor", icon: Gauge, Comp: MeasureMonitor },
  { key: "improve", label: "Improvement Calc", icon: TrendingUp, Comp: ImprovementCalc },
  { key: "forms", label: "Forms & Trackers", icon: FileText, Comp: null },
];

function Dashboard({ profile, onSignOut }) {
  const [active, setActive] = useState("coord");

  // client_team gets a lighter view — no HR module (sensitive: happiness scores, evaluations)
  const nav = profile.role === "client_team" ? NAV.filter((n) => n.key !== "hr") : NAV;
  const activeItem = nav.find((n) => n.key === active) || nav[0];
  const Active = activeItem.Comp;

  const isKauvexStaff = KAUVEX_ROLES.includes(profile.role);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paper, fontFamily: "Inter" }}>
      <style>{FONT_IMPORT}</style>

      {/* blueprint grid backdrop for header only */}
      <div style={{
        background: COLORS.ink, padding: "22px 28px", display: "flex", alignItems: "center",
        justifyContent: "space-between", backgroundImage:
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Building2 color={COLORS.amber} size={22} />
          <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 19, color: "#fff", letterSpacing: 0.3 }}>KAUVEX</span>
          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: COLORS.amber, marginLeft: 4 }}>OPS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "Inter", fontSize: 12.5, color: "#fff", fontWeight: 500 }}>
              {profile.full_name}
            </div>
            <div style={{ fontFamily: "IBM Plex Mono", fontSize: 10.5, color: isKauvexStaff ? COLORS.amber : "#B9C2C6" }}>
              {ROLE_LABELS[profile.role] || profile.role}{isKauvexStaff ? " · all clients" : ""}
            </div>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 2, color: "#B9C2C6", fontFamily: "Inter", fontSize: 12, cursor: "pointer",
            }}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div style={{ width: 230, background: "#fff", borderRight: `1px solid ${COLORS.line}`, minHeight: "calc(100vh - 66px)", padding: "20px 0" }}>
          {nav.map(({ key, label, icon: Icon }) => {
            const isActive = key === active;
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 22px", border: "none", background: isActive ? "#F1F5F4" : "transparent",
                  borderLeft: isActive ? `3px solid ${COLORS.blueprint}` : "3px solid transparent",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <Icon size={16} color={isActive ? COLORS.blueprint : COLORS.slate} />
                <span style={{
                  fontFamily: "Inter", fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                  color: isActive ? COLORS.ink : COLORS.slate,
                }}>
                  {label}
                </span>
                {isActive && <ChevronRight size={14} color={COLORS.blueprint} style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: "32px 36px" }}>
          {active === "forms" ? (
            <FormsModule companyId={profile.company_id} userId={profile.id} />
          ) : active === "coord" ? (
            <ProjectCoordination companyId={profile.company_id} />
          ) : active === "activity" ? (
            <ActivityModule companyId={profile.company_id} profile={profile} />
          ) : (
            <Active />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- AUTH GATE ---------------- */
export default function AuthGate() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = no profile row

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
      setProfile(undefined);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile(data ?? null);
      });
    return () => { cancelled = true; };
  }, [session]);

  function handleSignOut() {
    supabase.auth.signOut();
  }

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={22} color={COLORS.blueprint} className="spin" />
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) return <Login />;

  if (profile === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={22} color={COLORS.blueprint} className="spin" />
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!profile) return <PendingAccess email={session.user.email} onSignOut={handleSignOut} />;

  return <Dashboard profile={profile} onSignOut={handleSignOut} />;
}
