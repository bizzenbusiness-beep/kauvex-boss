import React, { useState, useMemo, useEffect, Suspense, lazy } from "react";
import {
  LayoutGrid, Users, Activity, Gauge, TrendingUp,
  Plus, Circle, Clock, CheckCircle2, ChevronRight, Building2,
  LogOut, Lock, Loader2, AlertCircle, FileText, Map
} from "lucide-react";
import { supabase } from "./lib/supabaseClient.js";

const FormsModule = lazy(() => import("./forms/FormsModule.jsx"));
const FramexTracker = lazy(() => import("./framex/FramexTracker.jsx"));
const MeasureMonitor = lazy(() => import("./MeasureMonitor.jsx"));

/* ---------------------------------------------------------
   KAUVEX OPS — internal command-center for BOSS BMW rollouts
   Design language: "site blueprint" — steel-blue + safety amber,
   corner tick-marks like architectural drawings, mono data type.
--------------------------------------------------------- */

const FONT_IMPORT = ``; // no external font fetch — system Georgia + sans for speed

const FONT_SERIF = "'Fraunces', Georgia, serif";
const FONT_SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const COLORS = {
  ink: "#111111",
  paper: "#F7F5F0",
  card: "#FFFFFF",
  blueprint: "#A8792F",
  blueprintSoft: "#F3EADA",
  amber: "#A8792F",
  amberSoft: "#F3EADA",
  slate: "#7A7568",
  green: "#2F7D52",
  greenSoft: "#E9F3EC",
  red: "#B23B2E",
  redSoft: "#F7E9E7",
  line: "#E7E2D6",
  gold: "#C9A35C",
  goldDeep: "#8A6420",
};

function CornerFrame({ children, accent = COLORS.blueprint, style = {} }) {
  return (
    <div style={{
      background: COLORS.card, borderRadius: 2, border: `1px solid ${COLORS.line}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function KpiTile({ label, value, unit, delta, accent }) {
  const up = delta >= 0;
  return (
    <CornerFrame accent={accent} style={{ background: COLORS.card, padding: "22px 18px", flex: 1, minWidth: 180 }}>
      <div style={{ fontFamily: FONT_SANS, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: COLORS.slate }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: 30, fontWeight: 600, color: COLORS.ink }}>{value}</span>
        {unit && <span style={{ fontFamily: FONT_SERIF, fontSize: 15, color: COLORS.slate }}>{unit}</span>}
      </div>
      <div style={{ fontFamily: FONT_SANS, fontSize: 11, marginTop: 8, letterSpacing: 0.3, color: up ? COLORS.green : COLORS.red }}>
        {up ? "▲" : "▼"} {Math.abs(delta)}% vs last month
      </div>
    </CornerFrame>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11, letterSpacing: 1.5, color: COLORS.amber, textTransform: "uppercase", marginBottom: 4 }}>
        {eyebrow}
      </div>
      <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 600, color: COLORS.ink, margin: 0 }}>{title}</h2>
    </div>
  );
}

/* ---------------- PROJECT COORDINATION ---------------- */
function ProjectCoordination({ companyId, profile }) {
  const [projectId, setProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(!!companyId);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("");

  const isAdmin = profile ? hasFullVisibility(profile.role) : true;
  const workerBranchId = profile && !isAdmin ? profile.branch_id : null;

  useEffect(() => {
    if (!companyId || !isAdmin) return;
    supabase.from("branches").select("id,name").eq("company_id", companyId).order("name").then(({ data }) => setBranches(data || []));
    // eslint-disable-next-line
  }, [companyId]);

  useEffect(() => {
    if (!companyId) { setLoading(false); return; }
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
        let query = supabase.from("tasks").select("*").eq("project_id", pid).order("created_at", { ascending: true });
        if (workerBranchId) query = query.eq("branch_id", workerBranchId);
        else if (isAdmin && branchFilter) query = query.eq("branch_id", branchFilter);
        const { data: taskRows } = await query;
        if (!cancelled) setTasks(taskRows || []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [companyId, workerBranchId, branchFilter]);

  async function addTask() {
    if (!draft.trim() || !projectId) return;
    const branch_id = workerBranchId || (isAdmin ? (branchFilter || null) : null);
    const { data: created } = await supabase
      .from("tasks")
      .insert({ project_id: projectId, title: draft.trim(), status: "todo", branch_id })
      .select()
      .single();
    if (created) setTasks((t) => [...t, created]);
    setDraft("");
  }

  async function cycleStatus(task) {
    const order = ["todo", "progress", "done"];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    const now = new Date().toISOString();
    const patch = { status: next, updated_at: now };
    if (next === "progress" && !task.started_at) patch.started_at = now;
    if (next === "done" && !task.completed_at) patch.completed_at = now;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, ...patch } : t)));
    await supabase.from("tasks").update(patch).eq("id", task.id);
  }

  function fmt(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  const colMeta = [
    { key: "todo", label: "To Do", accent: COLORS.slate, icon: Circle },
    { key: "progress", label: "In Progress", accent: COLORS.amber, icon: Clock },
    { key: "done", label: "Done", accent: COLORS.green, icon: CheckCircle2 },
  ];

  return (
    <div>
      <SectionHeading eyebrow="Module 01" title="Project Coordination" />
      {isAdmin && branches.length > 0 && companyId && (
        <div style={{ marginBottom: 16 }}>
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
            style={{ padding: "8px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 12.5, color: COLORS.ink }}>
            <option value="">All branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      {!companyId ? (
        <div style={{ fontSize: 13.5, color: COLORS.slate }}>
          No company selected yet. Kauvex staff: company switching for this module is coming soon — for now this links to your own profile's company.
        </div>
      ) : (
      <>
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task — e.g. Site visit, Palakkad"
          style={{
            flex: 1, padding: "10px 14px", border: `1px solid ${COLORS.line}`,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, background: COLORS.card, borderRadius: 2,
          }}
        />
        <button
          onClick={addTask}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
            background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer",
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
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: accent }}>
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
                        padding: "10px 12px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13.5, color: COLORS.ink, borderRadius: 8,
                        textAlign: "left", cursor: "pointer", display: "block", width: "100%",
                      }}
                    >
                      <div>{t.title}</div>
                      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                        {t.created_at && (
                          <div style={{ fontSize: 10.5, color: COLORS.slate }}>Given: {fmt(t.created_at)}</div>
                        )}
                        {t.started_at && (
                          <div style={{ fontSize: 10.5, color: COLORS.amber }}>Started: {fmt(t.started_at)}</div>
                        )}
                        {t.completed_at && (
                          <div style={{ fontSize: 10.5, color: COLORS.green }}>Completed: {fmt(t.completed_at)}</div>
                        )}
                      </div>
                    </button>
                  ))}
                  {colTasks.length === 0 && (
                    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12.5, color: COLORS.slate, fontStyle: "italic" }}>Nothing here yet</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}
    </div>
  );
}

/* ---------------- HR ---------------- */
function HRModule({ companyId }) {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: "", role: "", department: "", happiness_score: 7 });

  async function load() {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("team_members").select("*").eq("company_id", companyId).order("created_at", { ascending: true });
    setTeam(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [companyId]);

  async function addMember() {
    if (!draft.name.trim() || !companyId) return;
    const { data } = await supabase.from("team_members").insert({
      company_id: companyId, name: draft.name.trim(), role: draft.role, department: draft.department,
      happiness_score: Number(draft.happiness_score) || null,
    }).select().single();
    if (data) setTeam((t) => [...t, data]);
    setDraft({ name: "", role: "", department: "", happiness_score: 7 });
    setShowAdd(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <SectionHeading eyebrow="Module 02" title="HR & Team Happiness" />
        {companyId && (
          <button onClick={() => setShowAdd((s) => !s)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: COLORS.ink, color: "#fff",
            border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            <Plus size={15} /> Add Team Member
          </button>
        )}
      </div>

      {!companyId ? (
        <div style={{ fontSize: 13.5, color: COLORS.slate }}>
          No company selected yet. Use the company switcher at the top to pick a client.
        </div>
      ) : (
      <>
      {showAdd && (
        <CornerFrame style={{ padding: 16, marginBottom: 18, maxWidth: 620 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              style={{ flex: "1 1 140px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 13.5 }} />
            <input placeholder="Role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              style={{ flex: "1 1 120px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 13.5 }} />
            <input placeholder="Department" value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })}
              style={{ flex: "1 1 120px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 13.5 }} />
            <input type="number" min="1" max="10" placeholder="Happiness" value={draft.happiness_score}
              onChange={(e) => setDraft({ ...draft, happiness_score: e.target.value })}
              style={{ width: 90, padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 13.5 }} />
            <button onClick={addMember} style={{ padding: "9px 16px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Save
            </button>
          </div>
        </CornerFrame>
      )}

      {loading ? (
        <div style={{ color: COLORS.slate, fontSize: 13 }}>Loading team...</div>
      ) : (
      <CornerFrame style={{ background: COLORS.card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
          <thead>
            <tr style={{ background: COLORS.ink }}>
              {["Name", "Role", "Department", "Happiness"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: "#fff", fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.map((t, i) => (
              <tr key={t.id} style={{ borderTop: `1px solid ${COLORS.line}`, background: i % 2 ? "#FAFAF7" : "#fff" }}>
                <td style={{ padding: "10px 14px", fontSize: 13.5, color: COLORS.ink, fontWeight: 500 }}>{t.name}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: COLORS.slate }}>{t.role}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: COLORS.slate }}>{t.department}</td>
                <td style={{ padding: "10px 14px" }}>
                  {t.happiness_score ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 70, height: 6, background: COLORS.line, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${t.happiness_score * 10}%`, height: "100%", background: t.happiness_score >= 7 ? COLORS.green : COLORS.amber }} />
                      </div>
                      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, color: COLORS.slate }}>{t.happiness_score}/10</span>
                    </div>
                  ) : <span style={{ fontSize: 12, color: COLORS.slate }}>—</span>}
                </td>
              </tr>
            ))}
            {team.length === 0 && (
              <tr><td colSpan={4} style={{ padding: "16px 14px", fontSize: 13, color: COLORS.slate, fontStyle: "italic" }}>No team members yet — add one above.</td></tr>
            )}
          </tbody>
        </table>
      </CornerFrame>
      )}
      </>
      )}
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
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const isAdmin = hasFullVisibility(profile.role);
    let query = supabase
      .from("activity_logs")
      .select("*")
      .eq("company_id", companyId)
      .eq("log_date", today)
      .order("log_time", { ascending: false })
      .limit(30);
    if (!isAdmin && profile.branch_id) query = query.eq("branch_id", profile.branch_id);
    const { data } = await query;
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
      branch_id: profile.branch_id || null,
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

      {!companyId ? (
        <div style={{ fontSize: 13.5, color: COLORS.slate }}>
          No company selected yet. Kauvex staff: company switching for this module is coming soon — for now this links to your own profile's company.
        </div>
      ) : (
      <>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={handleCheckIn}
          disabled={checkedIn || posting}
          style={{
            padding: "9px 16px", borderRadius: 2, border: "none", cursor: checkedIn ? "default" : "pointer",
            background: checkedIn ? COLORS.line : COLORS.green, color: checkedIn ? COLORS.slate : "#fff",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 13,
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
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 13,
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
          style={{ flex: 1, padding: "10px 14px", border: `1px solid ${COLORS.line}`, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, background: COLORS.card, borderRadius: 2 }}
        />
        <button
          onClick={handleSubmitLog}
          disabled={posting}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
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
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5, color: COLORS.slate, width: 60 }}>{(l.log_time || "").slice(0, 5)}</div>
              <div style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5,
                color: "#fff", background: tagColor[l.activity_type] || COLORS.slate, padding: "2px 8px", borderRadius: 2, height: 18, width: 86, textAlign: "center",
              }}>
                {l.activity_type}
              </div>
              <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13.5, color: COLORS.ink, flex: 1 }}>{l.description}</div>
            </div>
          ))}
          {logs.length === 0 && <div style={{ fontSize: 13, color: COLORS.slate, fontStyle: "italic" }}>No activity logged today yet.</div>}
        </div>
      )}
      </>
      )}
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
            <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>Before (baseline)</div>
            <input
              type="number" value={before} onChange={(e) => setBefore(Number(e.target.value))}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.line}`, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 16, borderRadius: 2 }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>After (current)</div>
            <input
              type="number" value={after} onChange={(e) => setAfter(Number(e.target.value))}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.line}`, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 16, borderRadius: 2 }}
            />
          </label>
        </div>
        <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 16, display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, color: COLORS.slate }}>Improvement</span>
          <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 32, fontWeight: 700, color: positive ? COLORS.green : COLORS.red }}>
            {positive ? "+" : ""}{improvement}%
          </span>
        </div>
        <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, color: COLORS.slate, marginTop: 8 }}>
          Use this for any metric — leads, revenue, conversion rate, productive hours — to show progress at review time.
        </div>
      </CornerFrame>
    </div>
  );
}

/* ---------------- ROLE LABELS ---------------- */
const ROLE_LABELS = {
  // Company-level
  bdd: "Managing Director",
  bgm: "Chief General Manager",
  cbo: "Chief Business Officer",
  bom: "Chief Operations Officer",
  bdm: "Chief Development Officer",
  cgo: "Chief Growth Officer",
  accountant: "Finance Manager",
  manager: "Team Manager",
  sales: "Sales Executive",
  sales_manager: "Sales Manager",
  staff: "Office Staff",
  bso: "System Administrator",
  hr: "HR",
  marketing_executive: "Marketing Executive",
  marketing_manager: "Marketing Manager",
  team_leader: "Team Leader",
  company_investor: "Company Investor",
  // Platform-level (BizZen team)
  platform_owner: "Platform Owner",
  platform_dev: "Platform Developer",
  platform_support: "Support Executive",
  platform_bom: "Platform Sales",
  platform_investor: "Platform Investor",
};
const KAUVEX_ROLES = ["platform_owner", "platform_dev", "platform_support", "platform_bom", "platform_investor"];
// Company-side roles with full admin/leadership access (matches is_company_admin_or_leader() in SQL)
const COMPANY_ADMIN_ROLES = ["bdd", "bgm", "cbo", "bom", "bdm", "cgo", "bso"];
function hasFullVisibility(role) {
  return KAUVEX_ROLES.includes(role) || COMPANY_ADMIN_ROLES.includes(role);
}

const BFSP_LABELS = {
  bfspl: "BFSPL · Learning",
  bfspc: "BFSPC · Creation",
  bfspi: "BFSPI · Implementation",
};

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
      minHeight: "100vh", background: COLORS.ink, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    }}>
      <style>{FONT_IMPORT}</style>
      <CornerFrame accent={COLORS.amber} style={{ background: COLORS.card, padding: "36px 34px", width: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
          <Building2 color={COLORS.blueprint} size={22} />
          <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: 20, color: COLORS.ink }}>KAUVEX</span>
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11, color: COLORS.amber, marginLeft: 2 }}>OPS</span>
        </div>
        <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11, letterSpacing: 0.8, color: COLORS.slate, textTransform: "uppercase", marginBottom: 20 }}>
          Sign in to your workspace
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>Email</div>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, boxSizing: "border-box" }}
            />
          </label>
          <label style={{ display: "block", marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>Password</div>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, boxSizing: "border-box" }}
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
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 14, cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <Loader2 size={15} className="spin" /> : <Lock size={14} />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11.5, color: COLORS.slate, marginTop: 18, lineHeight: 1.5 }}>
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
    <div style={{ minHeight: "100vh", background: COLORS.paper, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{FONT_IMPORT}</style>
      <CornerFrame accent={COLORS.amber} style={{ background: COLORS.card, padding: "32px 30px", width: 380, textAlign: "center" }}>
        <Lock size={22} color={COLORS.amber} style={{ marginBottom: 12 }} />
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: 17, color: COLORS.ink, marginBottom: 8 }}>
          Access pending
        </div>
        <div style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.6, marginBottom: 20 }}>
          You're signed in as <strong>{email}</strong>, but no workspace role
          has been assigned to this account yet. Ask your Kauvex admin to add
          you.
        </div>
        <button
          onClick={onSignOut}
          style={{ padding: "9px 18px", background: "transparent", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, color: COLORS.ink, cursor: "pointer" }}
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
  { key: "framex", label: "BizZen Framex", icon: Map, Comp: null },
];

function Dashboard({ profile, onSignOut }) {
  const [active, setActive] = useState("coord");
  const isKauvexStaff = KAUVEX_ROLES.includes(profile.role);

  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(profile.company_id || null);

  useEffect(() => {
    if (!isKauvexStaff) return;
    supabase.from("companies").select("id,name").order("name").then(({ data }) => {
      setCompanies(data || []);
      if (!selectedCompanyId && data && data.length) setSelectedCompanyId(data[0].id);
    });
    // eslint-disable-next-line
  }, []);

  const effectiveCompanyId = isKauvexStaff ? selectedCompanyId : profile.company_id;

  // Roles without full company-admin access get a lighter nav — no HR module
  // (sensitive: happiness scores, evaluations)
  const nav = hasFullVisibility(profile.role) ? NAV : NAV.filter((n) => n.key !== "hr");
  const activeItem = nav.find((n) => n.key === active) || nav[0];
  const Active = activeItem.Comp;

  const todayLabel = new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  const NAV_LABELS_MAP = Object.fromEntries(NAV.map((n) => [n.key, n.label]));

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paper, fontFamily: FONT_SANS }}>
      <style>{FONT_IMPORT}</style>

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div style={{ width: 260, background: "#fff", borderRight: `1px solid ${COLORS.line}`, minHeight: "100vh", padding: "34px 26px", display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 15, letterSpacing: 3, textTransform: "uppercase", color: COLORS.ink }}>
            KAUVEX <span style={{ color: COLORS.gold }}>OPS</span>
          </div>

          {isKauvexStaff && (
            <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 2, padding: 16 }}>
              <div style={{ fontSize: 9.5, color: COLORS.slate, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Viewing Client</div>
              <select
                value={selectedCompanyId || ""}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                style={{
                  width: "100%", background: COLORS.paper, border: `1px solid ${COLORS.line}`, color: COLORS.ink,
                  padding: "9px 10px", borderRadius: 2, fontSize: 12.5, fontFamily: FONT_SANS,
                }}
              >
                {companies.length === 0 && <option value="">No clients yet</option>}
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <nav style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 4 }}>
            {nav.map(({ key, label }) => {
              const isActive = key === active;
              return (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  style={{
                    color: isActive ? COLORS.ink : COLORS.slate, textDecoration: "none", background: "none", border: "none",
                    padding: "11px 4px", fontSize: 12.5, letterSpacing: 0.4, textTransform: "uppercase", textAlign: "left",
                    borderBottom: isActive ? `1px solid ${COLORS.gold}` : "1px solid transparent",
                    fontWeight: isActive ? 600 : 400, cursor: "pointer", fontFamily: FONT_SANS,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div style={{ marginTop: "auto", paddingTop: 20, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 13, color: COLORS.ink, fontWeight: 600, marginBottom: 2 }}>{profile.full_name}</div>
            <div style={{ fontSize: 11, color: COLORS.gold, marginBottom: 14 }}>{ROLE_LABELS[profile.role] || profile.role}</div>
            <button
              onClick={onSignOut}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", width: "100%", justifyContent: "center",
                background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 2, color: COLORS.slate,
                fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: "40px 48px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32,
            borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 20,
          }}>
            <div>
              <h1 style={{ fontFamily: FONT_SERIF, fontSize: 26, margin: 0, color: COLORS.ink, fontWeight: 400 }}>
                {NAV_LABELS_MAP[active] || "Dashboard"}
              </h1>
              <div style={{ color: COLORS.slate, fontSize: 12, marginTop: 6, letterSpacing: 0.3 }}>
                {isKauvexStaff ? "Platform view · all clients" : "Company workspace"}
              </div>
            </div>
            <div style={{ border: `1px solid ${COLORS.gold}`, color: COLORS.gold, padding: "6px 16px", borderRadius: 2, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>
              {todayLabel}
            </div>
          </div>

          <Suspense fallback={<div style={{ color: COLORS.slate, fontSize: 13 }}>Loading...</div>}>
          {active === "forms" ? (
            <FormsModule companyId={effectiveCompanyId} userId={profile.id} />
          ) : active === "framex" ? (
            <FramexTracker />
          ) : active === "coord" ? (
            <ProjectCoordination companyId={effectiveCompanyId} profile={profile} />
          ) : active === "activity" ? (
            <ActivityModule companyId={effectiveCompanyId} profile={profile} />
          ) : active === "hr" ? (
            <HRModule companyId={effectiveCompanyId} />
          ) : (
            <Active />
          )}
          </Suspense>
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
