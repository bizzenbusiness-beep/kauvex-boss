import React, { useState, useMemo } from "react";
import {
  LayoutGrid, Users, Activity, Gauge, TrendingUp,
  Plus, Circle, Clock, CheckCircle2, ChevronRight, Building2
} from "lucide-react";

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
function ProjectCoordination() {
  const [columns, setColumns] = useState({
    todo: [
      { id: 1, text: "Site survey — Kozhikode Godown Phase 2" },
      { id: 2, text: "Structural drawing review — Palakkad Auditorium" },
    ],
    progress: [
      { id: 3, text: "Steel fabrication — Coimbatore Mall" },
      { id: 4, text: "Client sign-off — Bengaluru Warehouse" },
    ],
    done: [
      { id: 5, text: "Foundation handover — Kannur Complex" },
    ],
  });
  const [draft, setDraft] = useState("");

  function addTask() {
    if (!draft.trim()) return;
    setColumns((c) => ({ ...c, todo: [...c.todo, { id: Date.now(), text: draft.trim() }] }));
    setDraft("");
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {colMeta.map(({ key, label, accent, icon: Icon }) => (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Icon size={14} color={accent} />
              <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: accent }}>
                {label} · {columns[key].length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {columns[key].map((t) => (
                <div key={t.id} style={{
                  background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${accent}`,
                  padding: "10px 12px", fontFamily: "Inter", fontSize: 13.5, color: COLORS.ink, borderRadius: 2,
                }}>
                  {t.text}
                </div>
              ))}
              {columns[key].length === 0 && (
                <div style={{ fontFamily: "Inter", fontSize: 12.5, color: COLORS.slate, fontStyle: "italic" }}>Nothing here yet</div>
              )}
            </div>
          </div>
        ))}
      </div>
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
function ActivityModule() {
  const logs = [
    { time: "09:02", who: "Site Supervisor", text: "Checked in — Kozhikode site", tag: "Check-in" },
    { time: "10:15", who: "Project Manager", text: "Reviewed steel delivery schedule", tag: "Task" },
    { time: "12:40", who: "Accountant", text: "Logged Instalment 3 receipt", tag: "Finance" },
    { time: "14:20", who: "Digital Marketing", text: "Published 2 lead-gen posts", tag: "Marketing" },
    { time: "18:05", who: "Site Supervisor", text: "Checked out — 8.2 productive hrs", tag: "Check-out" },
  ];
  const tagColor = { "Check-in": COLORS.green, "Check-out": COLORS.red, Task: COLORS.blueprint, Finance: COLORS.amber, Marketing: COLORS.slate };
  return (
    <div>
      <SectionHeading eyebrow="Module 03" title="Activity Log" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {logs.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 16, padding: "12px 0", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
            <div style={{ fontFamily: "IBM Plex Mono", fontSize: 12.5, color: COLORS.slate, width: 50 }}>{l.time}</div>
            <div style={{
              fontFamily: "IBM Plex Mono", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5,
              color: "#fff", background: tagColor[l.tag], padding: "2px 8px", borderRadius: 2, height: 18, width: 76, textAlign: "center",
            }}>
              {l.tag}
            </div>
            <div style={{ fontFamily: "Inter", fontSize: 13.5, color: COLORS.ink, flex: 1 }}>
              <strong style={{ fontWeight: 600 }}>{l.who}</strong> — {l.text}
            </div>
          </div>
        ))}
      </div>
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

/* ---------------- SHELL ---------------- */
const NAV = [
  { key: "coord", label: "Project Coordination", icon: LayoutGrid, Comp: ProjectCoordination },
  { key: "hr", label: "HR", icon: Users, Comp: HRModule },
  { key: "activity", label: "Activity", icon: Activity, Comp: ActivityModule },
  { key: "measure", label: "Measure & Monitor", icon: Gauge, Comp: MeasureMonitor },
  { key: "improve", label: "Improvement Calc", icon: TrendingUp, Comp: ImprovementCalc },
];

export default function KauvexOps() {
  const [active, setActive] = useState("coord");
  const Active = NAV.find((n) => n.key === active).Comp;

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
        <div style={{ fontFamily: "IBM Plex Mono", fontSize: 12, color: "#B9C2C6" }}>
          Build Eye Structure LLP · Perinthalmanna
        </div>
      </div>

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div style={{ width: 230, background: "#fff", borderRight: `1px solid ${COLORS.line}`, minHeight: "calc(100vh - 66px)", padding: "20px 0" }}>
          {NAV.map(({ key, label, icon: Icon }) => {
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
          <Active />
        </div>
      </div>
    </div>
  );
}
