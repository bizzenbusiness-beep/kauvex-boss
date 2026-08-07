import React, { useState, useMemo, useEffect, Suspense, lazy } from "react";
import {
  LayoutGrid, Users, Activity, Gauge, TrendingUp,
  Plus, Circle, Clock, CheckCircle2, ChevronRight, Building2,
  LogOut, Lock, Loader2, AlertCircle, FileText, Map
} from "lucide-react";
import { supabase } from "./lib/supabaseClient.js";
import { t, LANGUAGES } from "./i18n.js";

const FormsModule = lazy(() => import("./forms/FormsModule.jsx"));
const FramexTracker = lazy(() => import("./framex/FramexTracker.jsx"));
const MeasureMonitor = lazy(() => import("./MeasureMonitor.jsx"));

/* ---------------------------------------------------------
   KAUVEX OPS — internal command-center for BOSS BMW rollouts
   Design language: "site blueprint" — steel-blue + safety amber,
   corner tick-marks like architectural drawings, mono data type.
--------------------------------------------------------- */

const FONT_IMPORT = ``; // no external font fetch — system Georgia + sans for speed

const FONT_SERIF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
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
      <h2 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 24, fontWeight: 600, color: COLORS.ink, margin: 0 }}>{title}</h2>
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
          <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 32, fontWeight: 700, color: positive ? COLORS.green : COLORS.red }}>
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
  operations: "Operations",
  hr: "HR",
  hr_manager: "HR Manager",
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
const COMPANY_ADMIN_ROLES = ["bdd", "bgm", "cbo", "bom", "bdm", "cgo", "bso", "hr_manager"];
function hasFullVisibility(role) {
  return KAUVEX_ROLES.includes(role) || COMPANY_ADMIN_ROLES.includes(role);
}

const BFSP_LABELS = {
  bfspl: "BFSPL · Learning",
  bfspc: "BFSPC · Creation",
  bfspi: "BFSPI · Implementation",
};

const BUSINESS_STAGES = ["New Business", "Struggle", "Survival", "Profitable", "Scalable", "Established Business", "Legacy"];
const LEGAL_STRUCTURES = ["Sole Proprietorship", "Partnership", "LLP", "Pvt Ltd", "Public Ltd"];
const TEAM_SIZES = ["Solo", "Small Team (2-10)", "Mid Team (11-50)", "Big Team/Enterprise (50+)"];

/* ---------------- ADD CLIENT MODAL ---------------- */
function AddClientModal({ onClose, onCreated, company }) {
  const isEdit = !!company;
  const [name, setName] = useState(company?.name || "");
  const [subdomain, setSubdomain] = useState(company?.subdomain || "");
  const [bfspCategory, setBfspCategory] = useState(company?.bfsp_category || "bfspi");
  const [businessStage, setBusinessStage] = useState(company?.business_stage || BUSINESS_STAGES[0]);
  const [legalStructure, setLegalStructure] = useState(company?.legal_structure || LEGAL_STRUCTURES[0]);
  const [teamSize, setTeamSize] = useState(company?.team_size || TEAM_SIZES[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function submit() {
    setErr(null);
    if (!name.trim()) { setErr("Client name is required."); return; }
    setBusy(true);
    const payload = {
      name: name.trim(),
      subdomain: subdomain.trim() || null,
      bfsp_category: bfspCategory,
      business_stage: businessStage,
      legal_structure: legalStructure,
      team_size: teamSize,
    };
    const query = isEdit
      ? supabase.from("companies").update(payload).eq("id", company.id).select().single()
      : supabase.from("companies").insert(payload).select().single();
    const { data, error } = await query;
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onCreated(data);
    onClose();
  }

  const fieldStyle = {
    width: "100%", background: COLORS.paper, border: `1px solid ${COLORS.line}`, color: COLORS.ink,
    padding: "9px 10px", borderRadius: 2, fontSize: 12.5, fontFamily: FONT_SANS, marginTop: 4,
  };
  const labelStyle = { fontSize: 9.5, color: COLORS.slate, textTransform: "uppercase", letterSpacing: 1.5 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,20,20,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: "#fff", borderRadius: 2, padding: 28, width: 420, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 17, marginBottom: 16, color: COLORS.ink }}>{isEdit ? "Edit Company" : "Add Company"}</div>

        {err && <div style={{ fontSize: 12, color: "#b3261e", marginBottom: 12 }}>{err}</div>}

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Client name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} placeholder="e.g. Malabar Furniture" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Subdomain (optional)</div>
          <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} style={fieldStyle} placeholder="e.g. malabar" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>BFSP Category</div>
          <select value={bfspCategory} onChange={(e) => setBfspCategory(e.target.value)} style={fieldStyle}>
            {Object.entries(BFSP_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Business stage</div>
          <select value={businessStage} onChange={(e) => setBusinessStage(e.target.value)} style={fieldStyle}>
            {BUSINESS_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Legal structure</div>
          <select value={legalStructure} onChange={(e) => setLegalStructure(e.target.value)} style={fieldStyle}>
            {LEGAL_STRUCTURES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={labelStyle}>Team size</div>
          <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)} style={fieldStyle}>
            {TEAM_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={busy} style={{ padding: "9px 16px", background: "transparent", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={busy} style={{ padding: "9px 16px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {busy ? "Saving..." : isEdit ? "Save Changes" : "Create Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPANIES (client management) ---------------- */
function CompaniesModule() {
  const [companies, setCompanies] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    const { data: cos } = await supabase.from("companies").select("*").eq("is_own_business", false).order("created_at", { ascending: true });
    setCompanies(cos || []);
    const { data: profs } = await supabase.from("profiles").select("company_id");
    const grouped = {};
    (profs || []).forEach((p) => {
      if (!p.company_id) return;
      grouped[p.company_id] = (grouped[p.company_id] || 0) + 1;
    });
    setCounts(grouped);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function deleteCompany(c) {
    const userCount = counts[c.id] || 0;
    const warning = userCount > 0
      ? `"${c.name}" has ${userCount} registered user(s). Deleting it will not delete those user accounts, but they will lose their company link. Delete "${c.name}" anyway?`
      : `Delete "${c.name}"? This cannot be undone.`;
    if (!window.confirm(warning)) return;
    const { error } = await supabase.from("companies").delete().eq("id", c.id);
    if (error) { alert("Could not delete: " + error.message); return; }
    load();
  }

  const cardStyle = {
    border: `1px solid ${COLORS.line}`, borderRadius: 2, padding: 20, background: "#fff",
    display: "flex", flexDirection: "column", gap: 12, minWidth: 280,
  };
  const badgeStyle = {
    fontSize: 10.5, padding: "3px 9px", borderRadius: 20, background: COLORS.paper,
    border: `1px solid ${COLORS.line}`, color: COLORS.slate,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <SectionHeading eyebrow="Client Management" title="Companies" />
        <button onClick={() => setShowAdd(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: COLORS.ink, color: "#fff",
          border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          + Add Company
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: COLORS.slate }}>Loading...</div>
      ) : companies.length === 0 ? (
        <div style={{ fontSize: 13, color: COLORS.slate }}>No companies yet — add the first one above.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {companies.map((c) => (
            <div key={c.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 15, color: COLORS.ink }}>{c.name}</div>
                <span style={badgeStyle}>{BFSP_LABELS[c.bfsp_category] || c.bfsp_category || "—"}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {c.business_stage && <span style={badgeStyle}>{c.business_stage}</span>}
                {c.team_size && <span style={badgeStyle}>{c.team_size}</span>}
                {c.legal_structure && <span style={badgeStyle}>{c.legal_structure}</span>}
              </div>
              <div style={{ fontSize: 12, color: COLORS.slate }}>
                {counts[c.id] || 0} registered user{(counts[c.id] || 0) === 1 ? "" : "s"}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => setEditing(c)} style={{
                  flex: 1, padding: "7px 10px", background: "transparent", border: `1px solid ${COLORS.line}`,
                  borderRadius: 2, fontSize: 12, cursor: "pointer",
                }}>
                  Edit
                </button>
                <button
                  onClick={() => alert("To create a real login for this client's team, use the local admin script (same pattern used for today's staff onboarding) — creating logins directly from the browser isn't safe.")}
                  style={{
                    flex: 1, padding: "7px 10px", background: "transparent", border: `1px solid ${COLORS.line}`,
                    borderRadius: 2, fontSize: 12, cursor: "pointer",
                  }}
                >
                  + Add user
                </button>
              </div>
              <button
                onClick={() => deleteCompany(c)}
                style={{
                  width: "100%", marginTop: 8, padding: "7px 10px", background: "transparent",
                  border: `1px solid ${COLORS.red}`, borderRadius: 2, fontSize: 12, cursor: "pointer", color: COLORS.red,
                }}
              >
                Delete Company
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddClientModal onClose={() => setShowAdd(false)} onCreated={() => load()} />
      )}
      {editing && (
        <AddClientModal company={editing} onClose={() => setEditing(null)} onCreated={() => load()} />
      )}
    </div>
  );
}

/* ---------------- OUR BUSINESS (Kauzar66's own units, hierarchical) ---------------- */
function OwnBusinessModule() {
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: cos } = await supabase.from("companies").select("*").eq("is_own_business", true).order("name", { ascending: true });
    setRows(cos || []);
    const { data: profs } = await supabase.from("profiles").select("company_id");
    const grouped = {};
    (profs || []).forEach((p) => {
      if (!p.company_id) return;
      grouped[p.company_id] = (grouped[p.company_id] || 0) + 1;
    });
    setCounts(grouped);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const topLevel = rows.filter((r) => !r.parent_company_id);
  const childrenOf = (id) => rows.filter((r) => r.parent_company_id === id);

  const cardStyle = {
    border: `1px solid ${COLORS.line}`, borderRadius: 2, padding: 18, background: "#fff",
  };
  const badgeStyle = {
    fontSize: 10.5, padding: "3px 9px", borderRadius: 20, background: COLORS.paper,
    border: `1px solid ${COLORS.line}`, color: COLORS.slate,
  };

  return (
    <div>
      <SectionHeading eyebrow="Kauzar66 Creative Venture Pvt Ltd" title="Our Business" />
      <p style={{ fontSize: 12.5, color: COLORS.slate, marginTop: 4, marginBottom: 20 }}>
        Our own units — not client accounts. Kept separate from the Companies (client) list.
      </p>

      {loading ? (
        <div style={{ fontSize: 13, color: COLORS.slate }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {topLevel.map((biz) => (
            <div key={biz.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 17, color: COLORS.ink }}>{biz.name}</div>
                {biz.bfsp_category && <span style={badgeStyle}>{BFSP_LABELS[biz.bfsp_category] || biz.bfsp_category}</span>}
              </div>
              <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 4 }}>
                {counts[biz.id] || 0} registered user{(counts[biz.id] || 0) === 1 ? "" : "s"}
              </div>

              {childrenOf(biz.id).length > 0 && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {childrenOf(biz.id).map((child) => (
                    <div key={child.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px", background: COLORS.paper, borderRadius: 2,
                      border: `1px solid ${COLORS.line}`,
                    }}>
                      <div style={{ fontSize: 13, color: COLORS.ink }}>{child.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {child.bfsp_category && <span style={badgeStyle}>{BFSP_LABELS[child.bfsp_category] || child.bfsp_category}</span>}
                        <span style={{ fontSize: 11.5, color: COLORS.slate }}>
                          {counts[child.id] || 0} user{(counts[child.id] || 0) === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- TEAM (role management, company-scoped) ---------------- */
const ASSIGNABLE_ROLES = [
  "bdd", "bgm", "cbo", "bom", "bdm", "cgo", "accountant", "manager", "sales",
  "sales_manager", "staff", "bso", "operations", "hr", "hr_manager",
  "marketing_executive", "marketing_manager", "team_leader", "company_investor",
];

function TeamModule({ viewCompanyId }) {
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [savingId, setSavingId] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) { setLoading(false); return; }
    const { data: myProf } = await supabase.from("profiles").select("id,company_id,role").eq("id", auth.user.id).single();
    setMe(myProf || null);
    // Platform-level staff (e.g. platform_owner) have no company_id of their own —
    // for them, viewCompanyId (the "Viewing Client" selection) tells us whose team to show.
    const targetCompanyId = viewCompanyId || myProf?.company_id;
    if (!targetCompanyId) { setLoading(false); return; }
    const { data: profs, error } = await supabase.from("profiles").select("*").eq("company_id", targetCompanyId).order("full_name", { ascending: true });
    if (error) { setErr(error.message); setLoading(false); return; }
    setRows(profs || []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [viewCompanyId]);

  async function changeRole(targetId, newRole) {
    setSavingId(targetId);
    setErr(null);
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", targetId);
    setSavingId(null);
    if (error) { setErr(error.message); return; }
    setRows((r) => r.map((row) => (row.id === targetId ? { ...row, role: newRole } : row)));
  }

  const cardStyle = { border: `1px solid ${COLORS.line}`, borderRadius: 2, padding: 0, background: "#fff", overflow: "hidden" };

  return (
    <div>
      <SectionHeading eyebrow="Access Management" title="Team" />
      <p style={{ fontSize: 12.5, color: COLORS.slate, marginTop: 4, marginBottom: 16 }}>
        Everyone in your company. Change a person's role below — platform-level roles can’t be assigned here.
      </p>

      {err && <div style={{ fontSize: 12, color: "#b3261e", marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div style={{ fontSize: 13, color: COLORS.slate }}>Loading...</div>
      ) : !(viewCompanyId || me?.company_id) ? (
        <div style={{ fontSize: 13, color: COLORS.slate }}>
          {viewCompanyId === null ? "No company selected — use the Viewing Client switcher above." : "No company on your profile yet."}
        </div>
      ) : (
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.ink }}>
                {["Name", "Email", "Role"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: "#fff", fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isSelf = r.id === me.id;
                return (
                  <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.line}`, background: i % 2 ? "#FAFAF7" : "#fff" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13.5, color: COLORS.ink, fontWeight: 500 }}>
                      {r.full_name || "—"} {isSelf && <span style={{ fontSize: 10.5, color: COLORS.slate }}>(you)</span>}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12.5, color: COLORS.slate }}>{r.email || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {isSelf ? (
                        <span style={{ fontSize: 13, color: COLORS.slate }}>{ROLE_LABELS[r.role] || r.role}</span>
                      ) : (
                        <select
                          value={r.role}
                          disabled={savingId === r.id}
                          onChange={(e) => changeRole(r.id, e.target.value)}
                          style={{
                            fontSize: 12.5, padding: "6px 8px", borderRadius: 2, border: `1px solid ${COLORS.line}`,
                            background: COLORS.paper, color: COLORS.ink,
                          }}
                        >
                          {ASSIGNABLE_ROLES.map((k) => (
                            <option key={k} value={k}>{ROLE_LABELS[k] || k}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={3} style={{ padding: "16px 14px", fontSize: 13, color: COLORS.slate, fontStyle: "italic" }}>No team members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- DASHBOARD (greeting + real-data summary) ---------------- */
function DashboardModule({ profile, isKauvexStaff, viewCompanyId }) {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [ownBizCount, setOwnBizCount] = useState(0);

  async function load() {
    setLoading(true);
    if (isKauvexStaff) {
      const { count: clients } = await supabase.from("companies").select("*", { count: "exact", head: true }).eq("is_own_business", false);
      const { count: ownBiz } = await supabase.from("companies").select("*", { count: "exact", head: true }).eq("is_own_business", true);
      setClientCount(clients || 0);
      setOwnBizCount(ownBiz || 0);
      if (viewCompanyId) {
        const { data: co } = await supabase.from("companies").select("name").eq("id", viewCompanyId).single();
        setCompanyName(co?.name || null);
        const { count: users } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("company_id", viewCompanyId);
        setUserCount(users || 0);
      }
    } else if (profile.company_id) {
      const { data: co } = await supabase.from("companies").select("name").eq("id", profile.company_id).single();
      setCompanyName(co?.name || null);
      const { count: users } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("company_id", profile.company_id);
      setUserCount(users || 0);
    }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [viewCompanyId]);

  const cardStyle = { border: `1px solid ${COLORS.line}`, borderRadius: 4, padding: 20, background: "#fff", flex: 1, minWidth: 160 };
  const firstName = (profile.full_name || "").split(" ")[0] || "there";

  return (
    <div>
      <SectionHeading eyebrow="Overview" title={`Welcome, ${firstName}`} />
      <p style={{ fontSize: 13, color: COLORS.slate, marginTop: 4, marginBottom: 20 }}>
        {companyName ? `${companyName} · ` : ""}{new Date().toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
      </p>

      {loading ? (
        <div style={{ fontSize: 13, color: COLORS.slate }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {isKauvexStaff ? (
            <>
              <div style={cardStyle}>
                <div style={{ fontSize: 10.5, color: COLORS.slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Client Companies</div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 28, color: COLORS.ink }}>{clientCount}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 10.5, color: COLORS.slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Our Business Units</div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 28, color: COLORS.ink }}>{ownBizCount}</div>
              </div>
              {companyName && (
                <div style={cardStyle}>
                  <div style={{ fontSize: 10.5, color: COLORS.slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{companyName} — Registered Users</div>
                  <div style={{ fontFamily: FONT_SERIF, fontSize: 28, color: COLORS.ink }}>{userCount}</div>
                </div>
              )}
            </>
          ) : (
            <div style={cardStyle}>
              <div style={{ fontSize: 10.5, color: COLORS.slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Your Company's Registered Users</div>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 28, color: COLORS.ink }}>{userCount}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- PUBLIC REGISTRATION FORM (no login required) ---------------- */
const REG_QUESTIONS = [
  { key: "q1", title: "നിങ്ങളുടെ ടീം സ്വയം initiative എടുക്കാറുണ്ടോ?" },
  { key: "q2", title: "ബിസിനസിന്റെ വളർച്ചയ്ക്കുള്ള യഥാർത്ഥ തടസ്സം എന്താണെന്ന് കണ്ടെത്തിയിട്ടുണ്ടോ?" },
  { key: "q3", title: "ഇതിനുമുമ്പ് 90 ദിവസത്തിനുള്ളിൽ നടപ്പിലാക്കി വിജയകരമാക്കാൻ പറ്റുന്ന ഒരു ഗ്രോത്ത് പ്ലാൻ നിങ്ങൾ തയ്യാറാക്കിയിട്ടുണ്ടോ?" },
  { key: "q4", title: "ഒരു ദിവസം പോലും നിങ്ങളില്ലെങ്കിൽ നിങ്ങളുടെ ബിസിനസ് തടസ്സമില്ലാതെ നടക്കുമോ?" },
  { key: "q5", title: "ഓരോ തീരുമാനത്തിനും ജീവനക്കാർ നിങ്ങളെത്തന്നെ കാത്തിരിക്കുന്ന ഒരു അവസ്ഥയിലാണോ നിങ്ങൾ?" },
  { key: "q6", title: "ബിസിനസ് വളരുന്നില്ല എന്നത് ഒരു തോന്നൽ മാത്രമാണോ, അതോ അതിൽ ഉറപ്പുണ്ടോ?" },
  { key: "q7", title: "90% ബിസിനസ് ഉടമകളും ചെയ്യാറുള്ള പ്രധാന തെറ്റുകള് എന്താണെന്ന് നിങ്ങളുടെ അഭിപ്രായത്തിൽ?" },
  { key: "q8", title: "ആഴ്ചയുടെ അവസാന ദിവസങ്ങളിൽ ഒരു പ്രത്യേക പ്ലാൻ തയ്യാറാക്കി, അത് കൃത്യമായി നടപ്പിലാക്കാറുണ്ടോ?" },
];

export function RegistrationForm() {
  const [draft, setDraft] = useState({
    name: "", business: "", phone: "", whatsapp: "", email: "", location: "",
    q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "", q9: "", final_need: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);

  function setField(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    if (!draft.name.trim() || !draft.business.trim() || !draft.phone.trim()) {
      setErr("പേര്, ബിസിനസ്, ഫോൺ നമ്പർ എന്നിവ നിര്ബന്ധമാണ്.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("diagnostic_registrations").insert(draft);
    setSubmitting(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
  }

  const fieldStyle = {
    width: "100%", padding: "11px 13px", border: "1.5px solid #D8CFBE", borderRadius: 9,
    fontSize: 15.5, fontFamily: "'Noto Sans Malayalam','Inter',sans-serif", background: "#FFFEFC",
  };
  const labelStyle = { display: "block", fontWeight: 700, fontSize: 14.5, color: "#0F3841", marginBottom: 7 };
  const cardStyle = { background: "#fff", border: "1px solid #D8CFBE", borderRadius: 16, padding: "28px 24px", marginBottom: 20 };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#FBF6EE", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ ...cardStyle, maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", color: "#0F3841" }}>തയ്യാറായി!</h2>
          <p style={{ color: "#6C7A78" }}>നിങ്ങളുടെ റജിസ്ട്രേഷൻ സ്വീകരിച്ചു. ആഗസ്റ്റ് 10-ന് കാണാം! 🙏</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FBF6EE", fontFamily: "'Inter','Noto Sans Malayalam',sans-serif" }}>
      <div style={{
        background: "linear-gradient(160deg,#0F3841,#1F5661 70%)", color: "#F6EFE2",
        padding: "48px 24px 64px", textAlign: "center",
      }}>
        <div style={{ fontSize: 12.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "#F2D9BC", fontWeight: 600, marginBottom: 10 }}>
          BIZZEN BUSINESS FRAMEX
        </div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: 32, margin: "0 0 8px" }}>
          ബിസിനസ് ഡയഗ്നോസ്റ്റിക് രജിസ്ട്രേഷൻ
        </h1>
        <div style={{ fontSize: 14 }}>ഓഗസ്റ്റ് 10 · Chef Lebanon, Kottakkal</div>
      </div>

      <form onSubmit={submit} style={{ maxWidth: 700, margin: "-40px auto 0", padding: "0 20px 60px", position: "relative" }}>
        <div style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div><label style={labelStyle}>പേര് *</label><input style={fieldStyle} value={draft.name} onChange={(e) => setField("name", e.target.value)} required /></div>
            <div><label style={labelStyle}>ബിസിനസ് *</label><input style={fieldStyle} value={draft.business} onChange={(e) => setField("business", e.target.value)} required /></div>
            <div><label style={labelStyle}>ഫോൺ നമ്പർ *</label><input style={fieldStyle} value={draft.phone} onChange={(e) => setField("phone", e.target.value)} required /></div>
            <div><label style={labelStyle}>വാട്സാപ്</label><input style={fieldStyle} value={draft.whatsapp} onChange={(e) => setField("whatsapp", e.target.value)} /></div>
            <div><label style={labelStyle}>ഇമെയിൽ</label><input style={fieldStyle} value={draft.email} onChange={(e) => setField("email", e.target.value)} /></div>
            <div><label style={labelStyle}>ലൊക്കേഷൻ</label><input style={fieldStyle} value={draft.location} onChange={(e) => setField("location", e.target.value)} /></div>
          </div>
        </div>

        {REG_QUESTIONS.map((qq, i) => (
          <div key={qq.key} style={cardStyle}>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18, color: "#0F3841", marginBottom: 12 }}>
              {i + 1}. {qq.title}
            </div>
            <textarea
              style={{ ...fieldStyle, minHeight: 70, resize: "vertical" }}
              value={draft[qq.key]}
              onChange={(e) => setField(qq.key, e.target.value)}
              placeholder="നിങ്ങളുടെ ഉത്തരം എഴുതുക..."
            />
          </div>
        ))}

        <div style={cardStyle}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18, color: "#0F3841", marginBottom: 12 }}>
            9. 90 ദിവസത്തെ ഗ്രോത്ത് റോഡ്‘മാപ്പിൽ സമയം ചെലവഴിക്കാൻ സന്നദ്ധനാണോ?
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #D8CFBE", padding: "10px 18px", borderRadius: 9, cursor: "pointer" }}>
              <input type="radio" name="q9" value="അതെ" checked={draft.q9 === "അതെ"} onChange={(e) => setField("q9", e.target.value)} /> അതെ
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #D8CFBE", padding: "10px 18px", borderRadius: 9, cursor: "pointer" }}>
              <input type="radio" name="q9" value="അല്ല" checked={draft.q9 === "അല്ല"} onChange={(e) => setField("q9", e.target.value)} /> അല്ല
            </label>
          </div>
        </div>

        <div style={cardStyle}>
          <label style={labelStyle}>നിലവിൽ ഏറ്റവും ആവശ്യമുള്ള സഹായം:</label>
          <textarea style={{ ...fieldStyle, minHeight: 90 }} value={draft.final_need} onChange={(e) => setField("final_need", e.target.value)} />

          {err && <div style={{ color: "#B23B2E", fontSize: 13, marginTop: 12 }}>{err}</div>}

          <button type="submit" disabled={submitting} style={{
            marginTop: 16, width: "100%", padding: "13px", background: "#C9762F", color: "#fff",
            border: "none", borderRadius: 9, fontWeight: 700, fontSize: 15.5, cursor: "pointer",
          }}>
            {submitting ? "അയച്ചുകൊണ്ടിരിക്കുന്നു..." : "റജിസ്ട്രേഷൻ സമർപ്പിക്കുക →"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- REGISTRATIONS (staff-only viewer) ---------------- */
function StaffRegistrationForm({ record, onClose, onSaved }) {
  const isEdit = !!record;
  const [draft, setDraft] = useState({
    name: record?.name || "", business: record?.business || "", phone: record?.phone || "",
    whatsapp: record?.whatsapp || "", email: record?.email || "", location: record?.location || "",
    q1: record?.q1 || "", q2: record?.q2 || "", q3: record?.q3 || "", q4: record?.q4 || "",
    q5: record?.q5 || "", q6: record?.q6 || "", q7: record?.q7 || "", q8: record?.q8 || "",
    q9: record?.q9 || "", final_need: record?.final_need || "",
    office_phase_status: record?.office_phase_status || "pending",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  function setField(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function submit() {
    setErr(null);
    if (!draft.name.trim() || !draft.business.trim() || !draft.phone.trim()) {
      setErr("Name, business, and phone are required.");
      return;
    }
    setSaving(true);
    const query = isEdit
      ? supabase.from("diagnostic_registrations").update(draft).eq("id", record.id)
      : supabase.from("diagnostic_registrations").insert(draft);
    const { error } = await query;
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved();
    onClose();
  }

  const fieldStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13, marginTop: 4 };
  const labelStyle = { fontSize: 11, color: COLORS.slate, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,20,20,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 2, padding: 24, width: 640, maxHeight: "88vh", overflow: "auto" }}>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 17, marginBottom: 4, color: COLORS.ink }}>
          {isEdit ? "Edit Registration" : "New Entry — First Phase [Office]"}
        </div>
        <p style={{ fontSize: 12, color: COLORS.slate, marginBottom: 16 }}>
          {isEdit ? "Verify or update this person's diagnostic answers." : "For walk-in / phone contacts who didn't use the public registration link."}
        </p>

        {err && <div style={{ fontSize: 12, color: COLORS.red, marginBottom: 12 }}>{err}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><div style={labelStyle}>Name *</div><input style={fieldStyle} value={draft.name} onChange={(e) => setField("name", e.target.value)} /></div>
          <div><div style={labelStyle}>Business *</div><input style={fieldStyle} value={draft.business} onChange={(e) => setField("business", e.target.value)} /></div>
          <div><div style={labelStyle}>Phone *</div><input style={fieldStyle} value={draft.phone} onChange={(e) => setField("phone", e.target.value)} /></div>
          <div><div style={labelStyle}>WhatsApp</div><input style={fieldStyle} value={draft.whatsapp} onChange={(e) => setField("whatsapp", e.target.value)} /></div>
          <div><div style={labelStyle}>Email</div><input style={fieldStyle} value={draft.email} onChange={(e) => setField("email", e.target.value)} /></div>
          <div><div style={labelStyle}>Location</div><input style={fieldStyle} value={draft.location} onChange={(e) => setField("location", e.target.value)} /></div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>First Phase [Office] status</div>
          <select style={fieldStyle} value={draft.office_phase_status} onChange={(e) => setField("office_phase_status", e.target.value)}>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="ready_for_health_checkup">Ready for Business Health Checkup</option>
          </select>
        </div>

        {REG_QUESTIONS.map((qq, i) => (
          <div key={qq.key} style={{ marginBottom: 12 }}>
            <div style={labelStyle}>{i + 1}. {qq.title}</div>
            <textarea style={{ ...fieldStyle, minHeight: 55 }} value={draft[qq.key]} onChange={(e) => setField(qq.key, e.target.value)} />
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>9. 90-day roadmap സന്നദ്ധത (അതെ / അല്ല)</div>
          <input style={fieldStyle} value={draft.q9} onChange={(e) => setField("q9", e.target.value)} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={labelStyle}>ആവശ്യമുള്ള സഹായം</div>
          <textarea style={{ ...fieldStyle, minHeight: 60 }} value={draft.final_need} onChange={(e) => setField("final_need", e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "9px 16px", background: "transparent", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: "9px 16px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistrationsModule() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("diagnostic_registrations").select("*").order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const cardStyle = { border: `1px solid ${COLORS.line}`, borderRadius: 2, padding: 16, background: "#fff", marginBottom: 10 };
  const statusLabel = { pending: "Pending", in_progress: "In Progress", ready_for_health_checkup: "Ready for Health Checkup" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <SectionHeading eyebrow="Aug 10 Event" title="Registrations" />
        <button onClick={() => setShowNew(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: COLORS.ink, color: "#fff",
          border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          + New Entry
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: COLORS.slate, marginBottom: 16 }}>{rows.length} registration(s) so far.</p>

      {loading ? (
        <div style={{ fontSize: 13, color: COLORS.slate }}>Loading...</div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: 13, color: COLORS.slate }}>No registrations yet.</div>
      ) : (
        rows.map((r) => (
          <div key={r.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ cursor: "pointer", flex: 1 }} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink }}>{r.name} — {r.business}</div>
                <div style={{ fontSize: 12, color: COLORS.slate }}>{r.phone} {r.whatsapp ? `· WA: ${r.whatsapp}` : ""} {r.location ? `· ${r.location}` : ""}</div>
                <div style={{ fontSize: 11, color: COLORS.amber, marginTop: 4, fontWeight: 600 }}>{statusLabel[r.office_phase_status] || "Pending"}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => setEditing(r)} style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 12, cursor: "pointer" }}>Edit</button>
                <div style={{ fontSize: 12, color: COLORS.slate }}>{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            {expanded === r.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.line}`, fontSize: 13, color: COLORS.ink, display: "flex", flexDirection: "column", gap: 8 }}>
                {REG_QUESTIONS.map((qq, i) => (
                  <div key={qq.key}><b>{i + 1}. {qq.title}</b><br />{r[qq.key] || "—"}</div>
                ))}
                <div><b>90-day roadmap സന്നദ്ധത:</b> {r.q9 || "—"}</div>
                <div><b>ആവശ്യമുള്ള സഹായം:</b> {r.final_need || "—"}</div>
              </div>
            )}
          </div>
        ))
      )}

      {showNew && <StaffRegistrationForm onClose={() => setShowNew(false)} onSaved={load} />}
      {editing && <StaffRegistrationForm record={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}

/* ---------------- LOGIN SCREEN ---------------- */
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("kauvex_lang") || "en"; } catch (e) { return "en"; }
  });
  useEffect(() => { try { localStorage.setItem("kauvex_lang", lang); } catch (e) {} }, [lang]);

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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Building2 color={COLORS.blueprint} size={22} />
          <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700, fontSize: 20, color: COLORS.ink }}>KAUVEX</span>
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11, color: COLORS.amber, marginLeft: 2 }}>OPS</span>
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
          {LANGUAGES.map((l) => (
            <button key={l.key} type="button" onClick={() => setLang(l.key)} style={{
              padding: "4px 9px", borderRadius: 20, fontSize: 11, cursor: "pointer",
              border: `1px solid ${lang === l.key ? COLORS.blueprint : COLORS.line}`,
              background: lang === l.key ? COLORS.blueprint : "#fff",
              color: lang === l.key ? "#fff" : COLORS.slate,
            }}>
              {l.label}
            </button>
          ))}
        </div>

        <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11, letterSpacing: 0.8, color: COLORS.slate, textTransform: "uppercase", marginBottom: 20 }}>
          {t("sign_in_workspace", lang)}
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>{t("email", lang)}</div>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, boxSizing: "border-box" }}
            />
          </label>
          <label style={{ display: "block", marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>{t("password", lang)}</div>
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
            {loading ? t("loading", lang) : t("sign_in", lang)}
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
        <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 17, color: COLORS.ink, marginBottom: 8 }}>
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
  { key: "dashboard", label: "Dashboard", i18n: "nav_dashboard", icon: LayoutGrid, Comp: DashboardModule },
  { key: "coord", label: "Project Coordination", i18n: "nav_coord", icon: CheckCircle2, Comp: ProjectCoordination },
  { key: "hr", label: "HR", i18n: "nav_hr", icon: Users, Comp: HRModule },
  { key: "activity", label: "Activity", i18n: "nav_activity", icon: Activity, Comp: ActivityModule },
  { key: "measure", label: "Measure & Monitor", i18n: "nav_measure", icon: Gauge, Comp: MeasureMonitor },
  { key: "improve", label: "Improvement Calc", i18n: "nav_improve", icon: TrendingUp, Comp: ImprovementCalc },
  { key: "forms", label: "Forms & Trackers", i18n: "nav_forms", icon: FileText, Comp: null },
  { key: "framex", label: "BizZen Framex", i18n: "nav_framex", icon: Map, Comp: null },
  { key: "companies", label: "Companies", i18n: "nav_companies", icon: Building2, Comp: CompaniesModule, kauvexOnly: true },
  { key: "ourbiz", label: "Our Business", i18n: "nav_ourbiz", icon: Building2, Comp: OwnBusinessModule, kauvexOnly: true },
  { key: "team", label: "Team", i18n: "nav_team", icon: Users, Comp: TeamModule, adminOnly: true },
  { key: "registrations", label: "Registrations", i18n: "nav_registrations", icon: FileText, Comp: RegistrationsModule, kauvexOnly: true },
];

function Dashboard({ profile, onSignOut }) {
  const [active, setActive] = useState("dashboard");
  const isKauvexStaff = KAUVEX_ROLES.includes(profile.role);
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("kauvex_lang") || "en"; } catch (e) { return "en"; }
  });
  useEffect(() => {
    try { localStorage.setItem("kauvex_lang", lang); } catch (e) {}
    const langMeta = LANGUAGES.find((l) => l.key === lang);
    document.documentElement.setAttribute("dir", langMeta?.dir || "ltr");
  }, [lang]);

  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(profile.company_id || null);
  const [showAddClient, setShowAddClient] = useState(false);

  useEffect(() => {
    if (!isKauvexStaff) return;
    supabase.from("companies").select("id,name").eq("is_own_business", false).order("name").then(({ data }) => {
      setCompanies(data || []);
      if (!selectedCompanyId && data && data.length) setSelectedCompanyId(data[0].id);
    });
    // eslint-disable-next-line
  }, []);

  const effectiveCompanyId = isKauvexStaff ? selectedCompanyId : profile.company_id;

  // Roles without full company-admin access get a lighter nav — no HR module
  // (sensitive: happiness scores, evaluations)
  const nav = (hasFullVisibility(profile.role) ? NAV : NAV.filter((n) => n.key !== "hr"))
    .filter((n) => !n.kauvexOnly || isKauvexStaff)
    .filter((n) => !n.adminOnly || hasFullVisibility(profile.role));
  const activeItem = nav.find((n) => n.key === active) || nav[0];
  const Active = activeItem.Comp;

  const todayLabel = new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  const NAV_LABELS_MAP = Object.fromEntries(NAV.map((n) => [n.key, t(n.i18n, lang)]));

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
            <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 4, padding: 16, background: "#FDFCF9" }}>
              <div style={{ fontSize: 9.5, color: COLORS.slate, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>Viewing Client</div>
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

          {isKauvexStaff && (
            <button
              onClick={() => setShowAddClient(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 12px", background: COLORS.ink, color: "#fff", border: "none",
                borderRadius: 2, fontWeight: 600, fontSize: 12, cursor: "pointer",
              }}
            >
              + Add Company
            </button>
          )}

          {showAddClient && (
            <AddClientModal
              onClose={() => setShowAddClient(false)}
              onCreated={(newCompany) => {
                setCompanies((prev) => [...prev, newCompany].sort((a, b) => a.name.localeCompare(b.name)));
                setSelectedCompanyId(newCompany.id);
              }}
            />
          )}

          <div>
            <div style={{ fontSize: 9.5, color: COLORS.slate, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Language</div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{
                width: "100%", background: COLORS.paper, border: `1px solid ${COLORS.line}`, color: COLORS.ink,
                padding: "9px 10px", borderRadius: 2, fontSize: 12.5, fontFamily: FONT_SANS,
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
            {nav.map(({ key, i18n, icon: Icon }) => {
              const isActive = key === active;
              return (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    color: isActive ? COLORS.ink : COLORS.slate,
                    textDecoration: "none",
                    background: isActive ? "rgba(199,161,90,0.12)" : "transparent",
                    border: "none", borderRadius: 4,
                    padding: "10px 10px", fontSize: 12.5, letterSpacing: 0.4, textTransform: "uppercase", textAlign: "left",
                    borderLeft: isActive ? `3px solid ${COLORS.gold}` : "3px solid transparent",
                    fontWeight: isActive ? 600 : 400, cursor: "pointer", fontFamily: FONT_SANS,
                    transition: "background 150ms ease, color 150ms ease",
                  }}
                >
                  {Icon && <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />}
                  {t(i18n, lang)}
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
              <LogOut size={13} /> {t("sign_out", lang)}
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
              <h1 style={{ fontFamily: FONT_SERIF, fontSize: 26, margin: 0, color: COLORS.ink, fontWeight: 700 }}>
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
            <Active
              {...(activeItem.key === "team" ? { viewCompanyId: effectiveCompanyId } : {})}
              {...(activeItem.key === "dashboard" ? { profile, isKauvexStaff, viewCompanyId: effectiveCompanyId } : {})}
              {...(activeItem.key === "measure" ? { companyId: effectiveCompanyId } : {})}
            />
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
