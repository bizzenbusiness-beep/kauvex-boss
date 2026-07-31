import React, { useState, useEffect } from "react";
import { ChevronLeft, Plus, CheckCircle2, Circle, Clock, StickyNote, CalendarClock, Trash2, Mic, Square, Sparkles, Languages, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient.js";

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

const JOURNEY_STAGES = [
  { key: "system_writeup", label: "System Write-up", desc: "BFSPI system documentation based on client's business" },
  { key: "site_visit", label: "Site Visit", desc: "Ground-level visit & data collection" },
  { key: "health_checkup", label: "Business Health Checkup", desc: "Current business stage, structure, operations review" },
  { key: "running_stage_analysis", label: "Running Stage Analysis", desc: "Analyze current gaps, find improvement areas" },
  { key: "system_demo", label: "System Demo Presentation", desc: "Present finalized system to client & team" },
  { key: "first_training", label: "System Apply — First Training", desc: "First training session, team implementation begins" },
];

const BOSS_BMW = [
  { key: "steacks", label: "BOSS STEACKS", desc: "Strategy, Think, Empowerment, Accountability, Clarity, Knowledge, Skill" },
  { key: "rise_month1_shift", label: "RISE — Month 1: SHIFT (1%)", desc: "Primary restructuring of the business system" },
  { key: "rise_month2_surge", label: "RISE — Month 2: SURGE (2%)", desc: "Operation strengthening, team development" },
  { key: "rise_month3_rise", label: "RISE — Month 3: RISE (3%)", desc: "System finalization, flow begins" },
  { key: "flow", label: "BOSS FLOW (30–60 days)", desc: "Ensure flow across all functions; 30%→90% success ratio" },
  { key: "summit", label: "BOSS SUMMIT (6mo+, optional)", desc: "Advanced accountability, 5X–7X predictable growth" },
];

const PILLARS = [
  { key: "pom", label: "POM", full: "Point of Marketing" },
  { key: "pos", label: "POS", full: "Point of Sales" },
  { key: "pom2", label: "POM2", full: "Procedure Optimization Model" },
  { key: "sops", label: "SOPS", full: "Standard Optimization Model" },
  { key: "fmc", label: "FMC", full: "Finance Management & Control" },
];

const FUNCTIONS = [
  { key: "management", label: "Mgmt" }, { key: "hr", label: "HR" }, { key: "rnd", label: "R&D" },
  { key: "marketing", label: "Mktg" }, { key: "sales", label: "Sales" },
  { key: "operations", label: "Ops" }, { key: "accounts", label: "Accts" },
];

const BFSP_STAGES = [
  { key: "bfspl", label: "BFSPL", full: "Learning" },
  { key: "bfspc", label: "BFSPC", full: "Creation" },
  { key: "bfspi", label: "BFSPI", full: "Implementation" },
];

const NOTE_LANGUAGES = [
  { key: "en", label: "English", speechLang: "en-IN" },
  { key: "ml", label: "Malayalam", speechLang: "ml-IN" },
  { key: "manglish", label: "Manglish", speechLang: "en-IN" },
  { key: "hi", label: "Hindi", speechLang: "hi-IN" },
  { key: "ar", label: "Arabic", speechLang: "ar-SA" },
];

const STATUS_META = {
  pending: { label: "Pending", color: COLORS.slate, icon: Circle },
  in_progress: { label: "In Progress", color: COLORS.amber, icon: Clock },
  done: { label: "Done", color: COLORS.green, icon: CheckCircle2 },
};

function StatusChip({ status, onChange }) {
  const order = ["pending", "in_progress", "done"];
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <button onClick={() => onChange(order[(order.indexOf(status) + 1) % order.length])} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 20,
      border: `1px solid ${meta.color}`, background: "#fff", color: meta.color, fontSize: 12, fontWeight: 600, cursor: "pointer",
    }}>
      <Icon size={13} /> {meta.label}
    </button>
  );
}

function CompanyList({ onSelect }) {
  const [companies, setCompanies] = useState([]);
  const [stagesByCompany, setStagesByCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");

  async function load() {
    setLoading(true);
    const { data: comps } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    const { data: stages } = await supabase.from("framex_journey_stages").select("company_id,status");
    const grouped = {};
    (stages || []).forEach((s) => {
      grouped[s.company_id] = grouped[s.company_id] || [];
      grouped[s.company_id].push(s.status);
    });
    setStagesByCompany(grouped);
    setCompanies(comps || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addCompany() {
    if (!name.trim()) return;
    const { data: created } = await supabase.from("companies").insert({ name: name.trim() }).select().single();
    if (created) await supabase.rpc("framex_seed_company", { p_company_id: created.id });
    setName(""); setShowAdd(false);
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "IBM Plex Mono", fontSize: 11, letterSpacing: 1, color: COLORS.amber, textTransform: "uppercase" }}>BizZen Business Framex</div>
          <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 22, color: COLORS.ink, margin: "4px 0 0" }}>Implementation Tracker</h2>
        </div>
        <button onClick={() => setShowAdd((s) => !s)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: COLORS.ink, color: "#fff",
          border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          <Plus size={15} /> Add Client
        </button>
      </div>

      {showAdd && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${COLORS.blueprint}`, padding: 16, marginBottom: 20, maxWidth: 420, display: "flex", gap: 8 }}>
          <input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)}
            style={{ flex: 1, padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5 }} />
          <button onClick={addCompany} style={{ padding: "9px 16px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Create
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ color: COLORS.slate, fontSize: 13 }}>Loading...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {companies.map((c) => {
            const st = stagesByCompany[c.id] || [];
            const done = st.filter((s) => s === "done").length;
            const pct = st.length ? Math.round((done / st.length) * 100) : 0;
            return (
              <button key={c.id} onClick={() => onSelect(c)} style={{
                textAlign: "left", background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${COLORS.amber}`,
                borderRadius: 2, padding: "14px 16px", cursor: "pointer",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>{c.name}</div>
                  {c.bfsp_category && (
                    <span style={{ fontFamily: "IBM Plex Mono", fontSize: 9.5, color: COLORS.blueprint, border: `1px solid ${COLORS.blueprint}`, borderRadius: 10, padding: "1px 7px", whiteSpace: "nowrap" }}>
                      {BFSP_STAGES.find((b) => b.key === c.bfsp_category)?.label}
                    </span>
                  )}
                </div>
                <div style={{ height: 6, background: COLORS.line, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? COLORS.green : COLORS.amber }} />
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.slate }}>{done}/{st.length || 6} stages · {pct}%</div>
              </button>
            );
          })}
          {companies.length === 0 && <div style={{ color: COLORS.slate, fontSize: 13, fontStyle: "italic" }}>No clients yet — add one to get started.</div>}
        </div>
      )}
    </div>
  );
}

function CompanyDetail({ company, onBack }) {
  const [tab, setTab] = useState("journey");
  const [stages, setStages] = useState([]);
  const [bmw, setBmw] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [notes, setNotes] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bfsp, setBfsp] = useState(company.bfsp_category || "");
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteLang, setNoteLang] = useState("en");
  const [recording, setRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const recognitionRef = React.useRef(null);
  const [apptDraft, setApptDraft] = useState({ title: "", with_whom: "", location: "", appointment_date: "", appointment_time: "" });

  async function load() {
    setLoading(true);
    const [{ data: s }, { data: b }, { data: m }, { data: n }, { data: a }] = await Promise.all([
      supabase.from("framex_journey_stages").select("*").eq("company_id", company.id).order("stage_order"),
      supabase.from("framex_boss_bmw").select("*").eq("company_id", company.id),
      supabase.from("framex_pillars_matrix").select("*").eq("company_id", company.id),
      supabase.from("company_notes").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").eq("company_id", company.id).order("appointment_date", { ascending: true }),
    ]);
    setStages(s || []); setBmw(b || []); setMatrix(m || []); setNotes(n || []); setAppointments(a || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [company.id]);

  async function updateStage(id, status) {
    setStages((arr) => arr.map((x) => (x.id === id ? { ...x, status } : x)));
    await supabase.from("framex_journey_stages").update({ status, completed_date: status === "done" ? new Date().toISOString().slice(0, 10) : null }).eq("id", id);
  }
  async function updateBmw(id, status) {
    setBmw((arr) => arr.map((x) => (x.id === id ? { ...x, status } : x)));
    await supabase.from("framex_boss_bmw").update({ status }).eq("id", id);
  }
  async function updateCell(id, status) {
    setMatrix((arr) => arr.map((x) => (x.id === id ? { ...x, status } : x)));
    await supabase.from("framex_pillars_matrix").update({ status }).eq("id", id);
  }
  async function updateBfsp(val) {
    setBfsp(val);
    await supabase.from("companies").update({ bfsp_category: val }).eq("id", company.id);
  }
  async function addNote() {
    if (!noteDraft.trim()) return;
    const { data } = await supabase.from("company_notes").insert({ company_id: company.id, note: noteDraft.trim() }).select().single();
    if (data) setNotes((arr) => [data, ...arr]);
    setNoteDraft("");
  }

  function toggleRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recording isn't supported in this browser. Try Chrome or Safari.");
      return;
    }
    if (recording) {
      recognitionRef.current && recognitionRef.current.stop();
      setRecording(false);
      return;
    }
    const langMeta = NOTE_LANGUAGES.find((l) => l.key === noteLang) || NOTE_LANGUAGES[0];
    const recognition = new SpeechRecognition();
    recognition.lang = langMeta.speechLang;
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setNoteDraft((d) => (d ? d + " " + transcript : transcript));
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  async function runAI(action) {
    if (!noteDraft.trim()) return;
    setAiLoading(true);
    try {
      const r = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteDraft, action, language: noteLang }),
      });
      const data = await r.json();
      if (data.result) setNoteDraft(data.result);
      else if (data.error) alert(data.error);
    } catch (e) {
      alert("AI request failed: " + e.message);
    }
    setAiLoading(false);
  }
  async function deleteNote(id) {
    setNotes((arr) => arr.filter((n) => n.id !== id));
    await supabase.from("company_notes").delete().eq("id", id);
  }
  async function addAppointment() {
    if (!apptDraft.title.trim()) return;
    const { data } = await supabase.from("appointments").insert({ company_id: company.id, ...apptDraft }).select().single();
    if (data) setAppointments((arr) => [...arr, data].sort((a, b) => (a.appointment_date || "").localeCompare(b.appointment_date || "")));
    setApptDraft({ title: "", with_whom: "", location: "", appointment_date: "", appointment_time: "" });
  }
  async function updateApptStatus(id, status) {
    setAppointments((arr) => arr.map((x) => (x.id === id ? { ...x, status } : x)));
    await supabase.from("appointments").update({ status }).eq("id", id);
  }

  if (loading) return <div style={{ color: COLORS.slate }}>Loading...</div>;

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: COLORS.slate, fontSize: 13, marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={15} /> Back to clients
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 21, color: COLORS.ink, margin: 0 }}>{company.name}</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {BFSP_STAGES.map((b) => (
            <button key={b.key} onClick={() => updateBfsp(b.key)} title={b.full} style={{
              padding: "5px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${bfsp === b.key ? COLORS.blueprint : COLORS.line}`,
              background: bfsp === b.key ? COLORS.blueprint : "#fff",
              color: bfsp === b.key ? "#fff" : COLORS.slate,
            }}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 22, borderBottom: `1px solid ${COLORS.line}`, flexWrap: "wrap" }}>
        {[["journey", "6-Stage Journey"], ["bmw", "BOSS BMW Program"], ["pillars", "5 Pillars Matrix"], ["notes", "Notes"], ["appointments", "Appointments"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "9px 4px", marginRight: 20, background: "none", border: "none", cursor: "pointer",
            borderBottom: tab === k ? `2px solid ${COLORS.blueprint}` : "2px solid transparent",
            color: tab === k ? COLORS.ink : COLORS.slate, fontWeight: tab === k ? 600 : 500, fontSize: 13.5,
          }}>
            {label}
          </button>
        ))}
      </div>


      {tab === "journey" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 800 }}>
          {stages.map((s, i) => {
            const meta = JOURNEY_STAGES.find((j) => j.key === s.stage_key) || {};
            return (
              <div key={s.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${COLORS.blueprint}`, padding: "13px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.amber, fontWeight: 700 }}>STAGE {i + 1}</div>
                    <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14.5, color: COLORS.ink, margin: "2px 0" }}>{meta.label}</div>
                    <div style={{ fontSize: 12.5, color: COLORS.slate }}>{meta.desc}</div>
                  </div>
                  <StatusChip status={s.status} onChange={(val) => updateStage(s.id, val)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "bmw" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 800 }}>
          {bmw.map((b) => {
            const meta = BOSS_BMW.find((j) => j.key === b.program_key) || {};
            return (
              <div key={b.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${COLORS.blueprint}`, padding: "13px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>{meta.label}</div>
                    <div style={{ fontSize: 12.5, color: COLORS.slate }}>{meta.desc}</div>
                  </div>
                  <StatusChip status={b.status} onChange={(val) => updateBmw(b.id, val)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "pillars" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11.5, color: COLORS.slate, borderBottom: `1px solid ${COLORS.line}` }}>Pillar</th>
                {FUNCTIONS.map((f) => (
                  <th key={f.key} style={{ textAlign: "center", padding: "8px 8px", fontSize: 11, color: COLORS.slate, borderBottom: `1px solid ${COLORS.line}` }}>{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PILLARS.map((p) => (
                <tr key={p.key}>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.line}` }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.ink }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: COLORS.slate }}>{p.full}</div>
                  </td>
                  {FUNCTIONS.map((f) => {
                    const cell = matrix.find((m) => m.pillar_key === p.key && m.function_key === f.key);
                    if (!cell) return <td key={f.key} style={{ borderBottom: `1px solid ${COLORS.line}` }} />;
                    const meta = STATUS_META[cell.status];
                    const Icon = meta.icon;
                    return (
                      <td key={f.key} style={{ textAlign: "center", padding: "8px", borderBottom: `1px solid ${COLORS.line}` }}>
                        <button
                          onClick={() => {
                            const order = ["pending", "in_progress", "done"];
                            updateCell(cell.id, order[(order.indexOf(cell.status) + 1) % order.length]);
                          }}
                          title={meta.label}
                          style={{ background: "none", border: "none", cursor: "pointer", color: meta.color }}
                        >
                          <Icon size={16} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "notes" && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select value={noteLang} onChange={(e) => setNoteLang(e.target.value)}
              style={{ padding: "8px 10px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 12.5 }}>
              {NOTE_LANGUAGES.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
            </select>
            <button onClick={toggleRecording} title="Voice input" style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 2, cursor: "pointer",
              border: `1px solid ${recording ? COLORS.red : COLORS.line}`, background: recording ? COLORS.red : "#fff",
              color: recording ? "#fff" : COLORS.ink, fontSize: 12.5, fontWeight: 600,
            }}>
              {recording ? <Square size={13} /> : <Mic size={13} />} {recording ? "Stop" : "Speak"}
            </button>
            <button onClick={() => runAI("polish")} disabled={aiLoading || !noteDraft.trim()} title="AI: polish this note" style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 2, cursor: "pointer",
              border: `1px solid ${COLORS.blueprint}`, background: "#fff", color: COLORS.blueprint, fontSize: 12.5, fontWeight: 600,
              opacity: !noteDraft.trim() ? 0.5 : 1,
            }}>
              {aiLoading ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} AI Polish
            </button>
            <button onClick={() => runAI("translate")} disabled={aiLoading || !noteDraft.trim()} title="AI: translate to selected language" style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 2, cursor: "pointer",
              border: `1px solid ${COLORS.amber}`, background: "#fff", color: COLORS.amber, fontSize: 12.5, fontWeight: 600,
              opacity: !noteDraft.trim() ? 0.5 : 1,
            }}>
              <Languages size={13} /> Translate
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <textarea
              value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add a note about this client — type, speak, or paste, then AI Polish / Translate if you like..."
              rows={3}
              style={{ flex: 1, padding: "9px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5, resize: "vertical", fontFamily: "Inter" }}
            />
            <button onClick={addNote} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer", alignSelf: "flex-start" }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notes.map((n) => (
              <div key={n.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${COLORS.amber}`, padding: "10px 14px" }}>
                <div>
                  <div style={{ fontSize: 13.5, color: COLORS.ink, whiteSpace: "pre-wrap" }}>{n.note}</div>
                  <div style={{ fontSize: 11, color: COLORS.slate, marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <button onClick={() => deleteNote(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.slate, flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {notes.length === 0 && <div style={{ fontSize: 13, color: COLORS.slate, fontStyle: "italic" }}>No notes yet.</div>}
          </div>
        </div>
      )}

      {tab === "appointments" && (
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            <input placeholder="Title" value={apptDraft.title} onChange={(e) => setApptDraft({ ...apptDraft, title: e.target.value })}
              style={{ flex: "2 1 160px", padding: "9px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <input placeholder="With (name)" value={apptDraft.with_whom} onChange={(e) => setApptDraft({ ...apptDraft, with_whom: e.target.value })}
              style={{ flex: "1 1 120px", padding: "9px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <input placeholder="Location" value={apptDraft.location} onChange={(e) => setApptDraft({ ...apptDraft, location: e.target.value })}
              style={{ flex: "1 1 120px", padding: "9px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <input type="date" value={apptDraft.appointment_date} onChange={(e) => setApptDraft({ ...apptDraft, appointment_date: e.target.value })}
              style={{ padding: "9px 8px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <input type="time" value={apptDraft.appointment_time} onChange={(e) => setApptDraft({ ...apptDraft, appointment_time: e.target.value })}
              style={{ padding: "9px 8px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <button onClick={addAppointment} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {appointments.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${COLORS.blueprint}`, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CalendarClock size={15} color={COLORS.blueprint} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: COLORS.slate }}>
                      {a.appointment_date || "No date"} {a.appointment_time || ""} {a.with_whom ? `· with ${a.with_whom}` : ""} {a.location ? `· ${a.location}` : ""}
                    </div>
                  </div>
                </div>
                <select value={a.status} onChange={(e) => updateApptStatus(a.id, e.target.value)} style={{ padding: "5px 8px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 12 }}>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            ))}
            {appointments.length === 0 && <div style={{ fontSize: 13, color: COLORS.slate, fontStyle: "italic" }}>No appointments yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FramexTracker() {
  const [selected, setSelected] = useState(null);
  return selected ? (
    <CompanyDetail company={selected} onBack={() => setSelected(null)} />
  ) : (
    <CompanyList onSelect={setSelected} />
  );
}
