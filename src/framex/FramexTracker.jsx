import React, { useState, useEffect } from "react";
import { ChevronLeft, Plus, CheckCircle2, Circle, Clock, StickyNote, CalendarClock, Trash2, Mic, Square, Sparkles, Languages, Loader2, Fingerprint, Upload, Download, FileAudio, FileVideo, FileImage, FileText, FileSpreadsheet, Paperclip, LogIn, LogOut } from "lucide-react";
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

const MEETING_TYPES = [
  { key: "brief", label: "Brief Meet" },
  { key: "review", label: "Review Meet" },
  { key: "board", label: "Board Meet" },
  { key: "evaluation", label: "Evaluation Meet" },
  { key: "valuation", label: "Valuation Meet" },
  { key: "measure", label: "Measure Meet" },
  { key: "monitor", label: "Monitor Meet" },
  { key: "improving", label: "Improving Meet" },
  { key: "emergency", label: "Emergency Meet" },
  { key: "agenda", label: "Agenda Meeting" },
  { key: "other", label: "Other" },
];

function fileTypeIcon(t) {
  if (t === "voice") return FileAudio;
  if (t === "video") return FileVideo;
  if (t === "image") return FileImage;
  if (t === "csv") return FileSpreadsheet;
  return FileText;
}

function detectFileType(file) {
  if (file.type.startsWith("audio")) return "voice";
  if (file.type.startsWith("video")) return "video";
  if (file.type.startsWith("image")) return "image";
  if (file.type === "application/pdf") return "pdf";
  if (file.name.toLowerCase().endsWith(".csv")) return "csv";
  return "file";
}

const CYCLE_DAYS = [
  { key: "green", label: "Friday — Green Day", color: "#2F7D52", who: "Consultant + Owner (BDD)", desc: "Discuss & finalize what will be done Monday–Saturday" },
  { key: "blue", label: "Saturday — Blue Day", color: "#2C5F7C", who: "Owner (BDD) + Operating Leaders", desc: "Review last week, design next week, fix gaps, healthy discussion" },
  { key: "orange", label: "Sunday — Orange Day", color: "#C67C2E", who: "Operating Team → BizZen BFSPI", desc: "Complete Mon–Sat document handoff; AI verifies first" },
  { key: "red", label: "Monday — Red Day", color: "#B23B2E", who: "Owner + Dept Heads → BizZen Admin", desc: "Mandatory manual second verification; Owner submits AI report of dept-head acceptance" },
];

function mostRecentFriday(fromDate = new Date()) {
  const d = new Date(fromDate);
  const day = d.getDay(); // 0=Sun...5=Fri...6=Sat
  const diff = (day >= 5) ? day - 5 : day + 2;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

const BFSP_STAGES = [
  { key: "bfspl", label: "BFSPL", full: "Learning" },
  { key: "bfspc", label: "BFSPC", full: "Creation" },
  { key: "bfspi", label: "BFSPI", full: "Implementation" },
];

const BUSINESS_CATEGORIES = [
  "F&B – Grocery/Supermarket/Hypermarket", "Restaurant / Cafe / Cloud Kitchen", "Bakery & Sweets",
  "Textiles & Garments", "Footwear", "Jewellery", "Electronics & Mobile", "Furniture & Home Decor",
  "Perfume & Cosmetics", "Automobile / Showroom", "Automobile Service & Spares",
  "Construction & Real Estate", "Steel / Fabrication / Manufacturing", "Interior Design",
  "Healthcare / Hospital / Clinic", "Pharmacy", "Diagnostics & Lab",
  "Education / Academy / Coaching Institute", "Skill Training / Certification",
  "Hospitality / Hotel / Resort", "Travel & Tourism",
  "IT / Software / SaaS", "Digital Marketing Agency", "Media & Entertainment",
  "Finance / Insurance / Investment", "Legal Services", "Accounting & Tax Services",
  "Logistics & Transportation", "Import / Export / Trading",
  "Manufacturer (F&B/B2B/Distribution)", "Manufacturer (B2B+Distribution+B2C)", "Wholesale & Distribution",
  "Solo Entrepreneur / Online / Freelance Services", "E-commerce", "Consulting Services",
  "Beauty & Salon / Spa", "Fitness / Gym / Wellness",
  "Agriculture / Dairy / Farming", "Event Management",
  "Service Sector — Other", "Other (specify in Sub-Category)",
];
const BUSINESS_STAGES = ["New Business", "Struggle", "Survival", "Profitable", "Scalable", "Established Business", "Legacy"];
const OFFERING_TYPES = ["Product", "Service", "Product + Service"];
const SALES_CHANNELS = ["Showroom", "Distributor", "B2B", "B2C", "Online", "Offline", "Online + Offline"];
const VALUE_CHAIN_ROLES = ["Manufacturer", "Distributor", "Manufacturer + Distributor", "Retailer/Trader", "Service Provider", "Manufacturer + Service"];
const TEAM_SIZES = ["Solo", "Small Team (2-10)", "Mid Team (11-50)", "Big Team/Enterprise (50+)"];
const LEGAL_STRUCTURES = ["Sole Proprietorship", "Partnership", "LLP", "Pvt Ltd", "Public Ltd"];

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
          <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11, letterSpacing: 1, color: COLORS.amber, textTransform: "uppercase" }}>BizZen Business Framex</div>
          <h2 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 22, color: COLORS.ink, margin: "4px 0 0" }}>Implementation Tracker</h2>
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
                  <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>{c.name}</div>
                  {c.bfsp_category && (
                    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9.5, color: COLORS.blueprint, border: `1px solid ${COLORS.blueprint}`, borderRadius: 10, padding: "1px 7px", whiteSpace: "nowrap" }}>
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

function TagGroup({ options, selected, onToggle, multi = true }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((opt) => {
        const isOn = multi ? selected.includes(opt) : selected === opt;
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              border: `1px solid ${isOn ? COLORS.blueprint : COLORS.line}`,
              background: isOn ? COLORS.blueprint : "#fff",
              color: isOn ? "#fff" : COLORS.slate, fontWeight: isOn ? 600 : 400,
            }}
          >
            {opt}
          </button>
        );
      })}
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
  const [setup, setSetup] = useState({
    business_category: company.business_category || "",
    business_subcategory: company.business_subcategory || "",
    business_stage: company.business_stage || "",
    offering_type: company.offering_type || [],
    sales_channel: company.sales_channel || [],
    value_chain_role: company.value_chain_role || [],
    team_size: company.team_size || "",
    legal_structure: company.legal_structure || "",
    current_income: company.current_income || "",
    market_share_pct: company.market_share_pct || "",
    client_retention_pct: company.client_retention_pct || "",
    competition_ratio: company.competition_ratio || "",
    anticipation_strategy: company.anticipation_strategy || "",
    penetration_strategy: company.penetration_strategy || "",
    bottleneck_notes: company.bottleneck_notes || "",
  });
  const [savingSetup, setSavingSetup] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchDraft, setBranchDraft] = useState({ name: "", location: "" });
  const [teamPerf, setTeamPerf] = useState([]);
  const [aiReport, setAiReport] = useState("");
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [weekOf, setWeekOf] = useState(mostRecentFriday());
  const [cycle, setCycle] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [orangeAiLoading, setOrangeAiLoading] = useState(false);
  const [redAiLoading, setRedAiLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ meeting_type: "brief", title: "", start_time: "", end_time: "", attendees: "" });
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [faceIdBusy, setFaceIdBusy] = useState(false);
  const [compareData, setCompareData] = useState([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [krakpiRows, setKrakpiRows] = useState([]);
  const [krakpiLoading, setKrakpiLoading] = useState(false);
  const [krakpiFilter, setKrakpiFilter] = useState("kra");
  const [newKrakpi, setNewKrakpi] = useState({ title: "", department: "", period: "", target: "", actual: "", unit: "%" });
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteLang, setNoteLang] = useState("en");
  const [recording, setRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const recognitionRef = React.useRef(null);
  const [apptDraft, setApptDraft] = useState({ title: "", with_whom: "", location: "", appointment_date: "", appointment_time: "" });

  async function load() {
    setLoading(true);
    const [{ data: s }, { data: b }, { data: m }, { data: n }, { data: a }, { data: br }, { data: tp }] = await Promise.all([
      supabase.from("framex_journey_stages").select("*").eq("company_id", company.id).order("stage_order"),
      supabase.from("framex_boss_bmw").select("*").eq("company_id", company.id),
      supabase.from("framex_pillars_matrix").select("*").eq("company_id", company.id),
      supabase.from("company_notes").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").eq("company_id", company.id).order("appointment_date", { ascending: true }),
      supabase.from("branches").select("*").eq("company_id", company.id).order("created_at", { ascending: true }),
      supabase.from("team_members").select("*").eq("company_id", company.id).order("created_at", { ascending: true }),
    ]);
    setStages(s || []); setBmw(b || []); setMatrix(m || []); setNotes(n || []); setAppointments(a || []); setBranches(br || []); setTeamPerf(tp || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [company.id]);

  useEffect(() => {
    if (tab === "meetings" && meetings.length === 0 && !meetingsLoading) loadMeetings();
    if (tab === "compare" && branches.length > 0) loadCompareData();
    if (tab === "krakpi" && krakpiRows.length === 0 && !krakpiLoading) loadKrakpi();
    // eslint-disable-next-line
  }, [tab, branches.length]);

  async function loadKrakpi() {
    setKrakpiLoading(true);
    const { data } = await supabase.from("kra_kpi_tracker").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
    setKrakpiRows(data || []);
    setKrakpiLoading(false);
  }

  async function addKrakpi() {
    if (!newKrakpi.title.trim()) return;
    const { data } = await supabase.from("kra_kpi_tracker").insert({
      company_id: company.id, item_type: krakpiFilter, title: newKrakpi.title.trim(),
      department: newKrakpi.department, period: newKrakpi.period,
      target: newKrakpi.target === "" ? null : Number(newKrakpi.target),
      actual: newKrakpi.actual === "" ? null : Number(newKrakpi.actual),
      unit: newKrakpi.unit,
    }).select().single();
    if (data) setKrakpiRows((r) => [data, ...r]);
    setNewKrakpi({ title: "", department: "", period: "", target: "", actual: "", unit: "%" });
  }

  async function updateKrakpi(id, field, value) {
    const parsed = (field === "target" || field === "actual") ? (value === "" ? null : Number(value)) : value;
    setKrakpiRows((r) => r.map((x) => (x.id === id ? { ...x, [field]: parsed } : x)));
    await supabase.from("kra_kpi_tracker").update({ [field]: parsed }).eq("id", id);
  }

  async function deleteKrakpi(id) {
    setKrakpiRows((r) => r.filter((x) => x.id !== id));
    await supabase.from("kra_kpi_tracker").delete().eq("id", id);
  }

  async function loadCompareData() {
    setCompareLoading(true);
    const branchIds = branches.map((b) => b.id);
    const [{ data: members }, { data: tasksData }] = await Promise.all([
      supabase.from("team_members").select("branch_id,happiness_score").in("branch_id", branchIds),
      supabase.from("tasks").select("branch_id,status").in("branch_id", branchIds),
    ]);
    const result = branches.map((b) => {
      const bMembers = (members || []).filter((m) => m.branch_id === b.id);
      const bTasks = (tasksData || []).filter((t) => t.branch_id === b.id);
      const happinessScores = bMembers.map((m) => m.happiness_score).filter((v) => v != null);
      const avgHappiness = happinessScores.length ? (happinessScores.reduce((a, v) => a + v, 0) / happinessScores.length) : null;
      const done = bTasks.filter((t) => t.status === "done").length;
      const pct = bTasks.length ? Math.round((done / bTasks.length) * 100) : null;
      return { branch: b, teamCount: bMembers.length, avgHappiness, taskTotal: bTasks.length, taskDone: done, completionPct: pct };
    });
    setCompareData(result);
    setCompareLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    setCycleLoading(true);
    supabase.from("weekly_cycle").select("*").eq("company_id", company.id).eq("week_of", weekOf).maybeSingle()
      .then(({ data }) => { if (!cancelled) { setCycle(data || null); setCycleLoading(false); } });
    return () => { cancelled = true; };
  }, [company.id, weekOf]);

  async function ensureCycle() {
    if (cycle) return cycle;
    const { data } = await supabase.from("weekly_cycle").insert({ company_id: company.id, week_of: weekOf }).select().single();
    setCycle(data);
    return data;
  }

  async function updateCycleField(field, value) {
    const row = await ensureCycle();
    const id = row?.id || cycle?.id;
    setCycle((c) => ({ ...(c || row), [field]: value }));
    if (id) await supabase.from("weekly_cycle").update({ [field]: value }).eq("id", id);
  }

  function shiftWeek(deltaDays) {
    const d = new Date(weekOf);
    d.setDate(d.getDate() + deltaDays);
    setWeekOf(d.toISOString().slice(0, 10));
  }

  async function runOrangeAiVerification() {
    setOrangeAiLoading(true);
    try {
      const context = `Company: ${company.name}. Friday plan (Green Day): ${cycle?.green_notes || "not recorded"}. Saturday review (Blue Day): ${cycle?.blue_notes || "not recorded"}. Write a brief AI verification note (3-4 sentences) on whether the Monday-Saturday document handoff looks complete and consistent with what was planned, and flag anything that looks missing or inconsistent.`;
      const r = await fetch("/api/ai-assist", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: context, action: "polish", language: "en" }),
      });
      const data = await r.json();
      if (data.result) await updateCycleField("orange_ai_verification", data.result);
      else if (data.error) alert(data.error);
    } catch (e) { alert("AI request failed: " + e.message); }
    setOrangeAiLoading(false);
  }

  async function runRedOwnerReport() {
    setRedAiLoading(true);
    try {
      const rows = teamPerf.filter((t) => t.role);
      const roster = rows.map((t) => `${t.name} — ${t.role}`).join(", ") || "no roster recorded";
      const context = `Company: ${company.name}. Department heads / executives on roster: ${roster}. Sunday AI verification of the week's handoff: ${cycle?.orange_ai_verification || "not yet run"}. Write a short AI-based report (for BizZen BFSPI) summarising, role by role, whether each department head/executive appears to have accepted and acted on their assigned responsibilities this week, based on the information given. Flag any role with no clear evidence of acceptance.`;
      const r = await fetch("/api/ai-assist", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: context, action: "polish", language: "en" }),
      });
      const data = await r.json();
      if (data.result) await updateCycleField("red_owner_report", data.result);
      else if (data.error) alert(data.error);
    } catch (e) { alert("AI request failed: " + e.message); }
    setRedAiLoading(false);
  }

  async function loadMeetings() {
    setMeetingsLoading(true);
    const { data } = await supabase.from("meetings").select("*").eq("company_id", company.id).order("start_time", { ascending: false });
    setMeetings(data || []);
    setMeetingsLoading(false);
  }

  async function addMeeting() {
    if (!newMeeting.title.trim()) return;
    const { data } = await supabase.from("meetings").insert({
      company_id: company.id,
      meeting_type: newMeeting.meeting_type,
      title: newMeeting.title.trim(),
      attendees: newMeeting.attendees,
      start_time: newMeeting.start_time || null,
      end_time: newMeeting.end_time || null,
    }).select().single();
    if (data) setMeetings((m) => [data, ...m]);
    setNewMeeting({ meeting_type: "brief", title: "", start_time: "", end_time: "", attendees: "" });
  }

  async function updateMeeting(id, patch) {
    setMeetings((arr) => arr.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    await supabase.from("meetings").update(patch).eq("id", id);
  }

  async function selectMeeting(id) {
    setSelectedMeetingId(id === selectedMeetingId ? null : id);
    if (id && id !== selectedMeetingId) {
      const { data } = await supabase.from("meeting_attachments").select("*").eq("meeting_id", id).order("created_at", { ascending: false });
      setAttachments(data || []);
    }
  }

  async function tryFaceId() {
    if (!window.PublicKeyCredential) return false;
    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) return false;
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Kauvex Ops" },
          user: { id: new Uint8Array(16), name: "meeting-checkin", displayName: "Meeting Check-in" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 30000,
        },
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async function handleCheckIn(meeting, useFaceId) {
    let method = "manual";
    if (useFaceId) {
      setFaceIdBusy(true);
      const ok = await tryFaceId();
      setFaceIdBusy(false);
      if (!ok) { alert("Face ID / device biometric isn't available or was cancelled. Checked in manually instead."); }
      else method = "faceid";
    }
    updateMeeting(meeting.id, { checkin_time: new Date().toISOString(), checkin_method: method, status: "in_progress" });
  }

  function handleCheckOut(meeting) {
    updateMeeting(meeting.id, { checkout_time: new Date().toISOString(), status: "completed" });
  }

  async function uploadFiles(meetingId, files) {
    setUploading(true);
    for (const file of Array.from(files)) {
      const path = `${company.id}/${meetingId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("meeting-files").upload(path, file);
      if (error) { alert(error.message); continue; }
      const { data: urlData } = supabase.storage.from("meeting-files").getPublicUrl(path);
      const { data: inserted } = await supabase.from("meeting_attachments").insert({
        meeting_id: meetingId, company_id: company.id, file_name: file.name,
        file_type: detectFileType(file), file_url: urlData.publicUrl,
      }).select().single();
      if (inserted) setAttachments((a) => [inserted, ...a]);
    }
    setUploading(false);
  }

  function exportMeetingsCsv() {
    const header = "title,meeting_type,start_time,end_time,attendees,status\n";
    const rows = meetings.map((m) => [
      (m.title || "").replace(/,/g, ";"), m.meeting_type, m.start_time || "", m.end_time || "",
      (m.attendees || "").replace(/,/g, ";"), m.status,
    ].join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `meetings_${company.name.replace(/\s+/g, "_")}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function importMeetingsCsv(file) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const [, ...rows] = lines; // skip header
    const parsed = rows.map((line) => {
      const [title, meeting_type, start_time, end_time, attendees, status] = line.split(",");
      return {
        company_id: company.id, title: title || "Untitled", meeting_type: meeting_type || "other",
        start_time: start_time || null, end_time: end_time || null, attendees: attendees || "", status: status || "scheduled",
      };
    });
    if (parsed.length === 0) return;
    const { data } = await supabase.from("meetings").insert(parsed).select();
    if (data) setMeetings((m) => [...data, ...m]);
  }

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

  function toggleTag(field, value) {
    setSetup((s) => {
      const arr = s[field] || [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...s, [field]: next };
    });
  }

  async function saveSetup() {
    setSavingSetup(true);
    await supabase.from("companies").update(setup).eq("id", company.id);
    setSavingSetup(false);
  }

  async function addBranch() {
    if (!branchDraft.name.trim()) return;
    const { data } = await supabase.from("branches").insert({
      company_id: company.id, name: branchDraft.name.trim(), location: branchDraft.location.trim(),
    }).select().single();
    if (data) setBranches((b) => [...b, data]);
    setBranchDraft({ name: "", location: "" });
  }

  async function deleteBranch(id) {
    setBranches((b) => b.filter((x) => x.id !== id));
    await supabase.from("branches").delete().eq("id", id);
  }

  async function updatePerf(id, field, value) {
    setTeamPerf((arr) => arr.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
    await supabase.from("team_members").update({ [field]: value === "" ? null : value }).eq("id", id);
  }

  async function generateAiReport() {
    const rows = teamPerf.filter((t) => t.expected_performance_pct != null || t.actual_performance_pct != null);
    if (rows.length === 0) { alert("Add expected/actual performance % for at least one team member first."); return; }
    const summaryText = rows.map((t) => {
      const exp = t.expected_performance_pct ?? "—";
      const act = t.actual_performance_pct ?? "—";
      const loss = (t.expected_performance_pct != null && t.actual_performance_pct != null)
        ? (t.expected_performance_pct - t.actual_performance_pct).toFixed(1) : "—";
      return `${t.name} (${t.role || "role n/a"}): expected ${exp}%, actual ${act}%, loss ${loss}%. Notes: ${t.performance_notes || "none"}.`;
    }).join("\n");
    setAiReportLoading(true);
    setAiReport("");
    try {
      const r = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Team performance data for ${company.name}, roles from Managing Director down to staff:\n${summaryText}\n\nWrite a short business report: which roles are underperforming (highest loss %), what the likely business impact is, and 2-3 concrete recommendations to close the gap.`,
          action: "polish", language: "en",
        }),
      });
      const data = await r.json();
      if (data.result) setAiReport(data.result);
      else if (data.error) alert(data.error);
    } catch (e) {
      alert("AI request failed: " + e.message);
    }
    setAiReportLoading(false);
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
        <h2 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 21, color: COLORS.ink, margin: 0 }}>{company.name}</h2>
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
        {[["setup", "Company Setup"], ["branches", "Branches"], ["compare", "Branch Comparison"], ["krakpi", "KRA/KPI Tracker"], ["performance", "Role Performance"], ["weekly", "Weekly Cycle"], ["meetings", "Meeting Room"], ["journey", "6-Stage Journey"], ["bmw", "BOSS BMW Program"], ["pillars", "5 Pillars Matrix"], ["notes", "Notes"], ["appointments", "Appointments"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "9px 4px", marginRight: 20, background: "none", border: "none", cursor: "pointer",
            borderBottom: tab === k ? `2px solid ${COLORS.blueprint}` : "2px solid transparent",
            color: tab === k ? COLORS.ink : COLORS.slate, fontWeight: tab === k ? 600 : 500, fontSize: 13.5,
          }}>
            {label}
          </button>
        ))}
      </div>


      {tab === "setup" && (
        <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.ink, display: "block", marginBottom: 6 }}>Business Category</label>
            <select value={setup.business_category} onChange={(e) => setSetup({ ...setup, business_category: e.target.value })}
              style={{ width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5 }}>
              <option value="">Select category</option>
              {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.ink, display: "block", marginBottom: 6 }}>Business Type (Sub-Category)</label>
            <input value={setup.business_subcategory} onChange={(e) => setSetup({ ...setup, business_subcategory: e.target.value })}
              placeholder="Specific type within the category — e.g. Steel Fabrication, Menswear Retail, Cardiology Clinic..."
              style={{ width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5 }} />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.ink, display: "block", marginBottom: 6 }}>Business Stage</label>
            <TagGroup options={BUSINESS_STAGES} selected={setup.business_stage} multi={false}
              onToggle={(v) => setSetup({ ...setup, business_stage: v })} />
          </div>

          <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 18 }}>
            <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 16, fontWeight: 600, color: COLORS.ink, marginBottom: 14 }}>
              Business Structure Profile
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Offering Type</label>
                <TagGroup options={OFFERING_TYPES} selected={setup.offering_type} onToggle={(v) => toggleTag("offering_type", v)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Sales Channel / Model</label>
                <TagGroup options={SALES_CHANNELS} selected={setup.sales_channel} onToggle={(v) => toggleTag("sales_channel", v)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Value-chain Role</label>
                <TagGroup options={VALUE_CHAIN_ROLES} selected={setup.value_chain_role} onToggle={(v) => toggleTag("value_chain_role", v)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Team Size</label>
                <TagGroup options={TEAM_SIZES} selected={setup.team_size} multi={false} onToggle={(v) => setSetup({ ...setup, team_size: v })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Legal Structure</label>
                <TagGroup options={LEGAL_STRUCTURES} selected={setup.legal_structure} multi={false} onToggle={(v) => setSetup({ ...setup, legal_structure: v })} />
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 18 }}>
            <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 16, fontWeight: 600, color: COLORS.ink, marginBottom: 14 }}>
              Business Metrics &amp; Strategy
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Current Income / Revenue (₹)</label>
                <input type="number" value={setup.current_income} onChange={(e) => setSetup({ ...setup, current_income: e.target.value })}
                  style={{ width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Current Market Share (%)</label>
                <input type="number" value={setup.market_share_pct} onChange={(e) => setSetup({ ...setup, market_share_pct: e.target.value })}
                  style={{ width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Client Retention / Take Share (%)</label>
                <input type="number" value={setup.client_retention_pct} onChange={(e) => setSetup({ ...setup, client_retention_pct: e.target.value })}
                  style={{ width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Competition Ratio</label>
                <input value={setup.competition_ratio} onChange={(e) => setSetup({ ...setup, competition_ratio: e.target.value })}
                  placeholder="e.g. 3 major competitors, we rank #2"
                  style={{ width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5 }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Anticipation Strategy (what's expected next, how we prepare)</label>
                <textarea value={setup.anticipation_strategy} onChange={(e) => setSetup({ ...setup, anticipation_strategy: e.target.value })}
                  rows={2} style={{ width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5, fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Market Penetration Strategy</label>
                <textarea value={setup.penetration_strategy} onChange={(e) => setSetup({ ...setup, penetration_strategy: e.target.value })}
                  rows={2} style={{ width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5, fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.slate, display: "block", marginBottom: 6 }}>Delay / Bottleneck Areas</label>
                <textarea value={setup.bottleneck_notes} onChange={(e) => setSetup({ ...setup, bottleneck_notes: e.target.value })}
                  rows={2} style={{ width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5, fontFamily: "inherit" }} />
              </div>
            </div>
          </div>

          <button onClick={saveSetup} disabled={savingSetup} style={{
            alignSelf: "flex-start", padding: "10px 20px", background: COLORS.ink, color: "#fff", border: "none",
            borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            {savingSetup ? "Saving..." : "Save Company Setup"}
          </button>
        </div>
      )}

      {tab === "branches" && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <input placeholder="Branch name" value={branchDraft.name} onChange={(e) => setBranchDraft({ ...branchDraft, name: e.target.value })}
              style={{ flex: 1, padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5 }} />
            <input placeholder="Location" value={branchDraft.location} onChange={(e) => setBranchDraft({ ...branchDraft, location: e.target.value })}
              style={{ flex: 1, padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5 }} />
            <button onClick={addBranch} style={{ padding: "9px 16px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Add
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {branches.map((b) => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${COLORS.blueprint}`, padding: "10px 14px" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.slate }}>{b.location}</div>
                </div>
                <button onClick={() => deleteBranch(b.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.slate }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {branches.length === 0 && <div style={{ fontSize: 13, color: COLORS.slate, fontStyle: "italic" }}>No branches yet — add the first one above.</div>}
          </div>
        </div>
      )}

      {tab === "performance" && (
        <div style={{ maxWidth: 900 }}>
          <div style={{ fontSize: 13, color: COLORS.slate, marginBottom: 16 }}>
            Track expected vs actual output for every role — from Managing Director / Owner down to Office Staff.
            The gap (Loss Ratio) shows where the business is bleeding performance.
          </div>
          <div style={{ overflowX: "auto", marginBottom: 20 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 700 }}>
              <thead>
                <tr>
                  {["Name", "Role", "Expected %", "Actual %", "Loss %", "Notes"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, color: COLORS.slate, borderBottom: `1px solid ${COLORS.line}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamPerf.map((t) => {
                  const loss = (t.expected_performance_pct != null && t.actual_performance_pct != null)
                    ? (t.expected_performance_pct - t.actual_performance_pct) : null;
                  return (
                    <tr key={t.id}>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{t.name}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12.5, color: COLORS.slate }}>{t.role}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${COLORS.line}` }}>
                        <input type="number" min="0" max="100" defaultValue={t.expected_performance_pct ?? ""}
                          onBlur={(e) => updatePerf(t.id, "expected_performance_pct", e.target.value === "" ? "" : Number(e.target.value))}
                          style={{ width: 64, padding: "5px 7px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 12.5 }} />
                      </td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${COLORS.line}` }}>
                        <input type="number" min="0" max="100" defaultValue={t.actual_performance_pct ?? ""}
                          onBlur={(e) => updatePerf(t.id, "actual_performance_pct", e.target.value === "" ? "" : Number(e.target.value))}
                          style={{ width: 64, padding: "5px 7px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 12.5 }} />
                      </td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13, fontWeight: 700, color: loss == null ? COLORS.slate : loss > 15 ? COLORS.red : loss > 5 ? COLORS.amber : COLORS.green }}>
                        {loss == null ? "—" : `${loss.toFixed(1)}%`}
                      </td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${COLORS.line}` }}>
                        <input defaultValue={t.performance_notes || ""} placeholder="optional note"
                          onBlur={(e) => updatePerf(t.id, "performance_notes", e.target.value)}
                          style={{ width: 160, padding: "5px 7px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 12.5 }} />
                      </td>
                    </tr>
                  );
                })}
                {teamPerf.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "14px 10px", fontSize: 13, color: COLORS.slate, fontStyle: "italic" }}>
                    No team members yet — add them from the HR module first.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <button onClick={generateAiReport} disabled={aiReportLoading} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: COLORS.ink, color: "#fff",
            border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 16,
          }}>
            {aiReportLoading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
            {aiReportLoading ? "Generating..." : "Generate AI Performance Report"}
          </button>
          <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {aiReport && (
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${COLORS.blueprint}`, padding: "16px 18px", whiteSpace: "pre-wrap", fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6 }}>
              {aiReport}
            </div>
          )}
        </div>
      )}

      {tab === "weekly" && (
        <div style={{ maxWidth: 820 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <button onClick={() => shiftWeek(-7)} style={{ padding: "6px 12px", border: `1px solid ${COLORS.line}`, background: "#fff", borderRadius: 2, cursor: "pointer", fontSize: 12.5 }}>← Previous week</button>
            <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 15, fontWeight: 600, color: COLORS.ink }}>
              Week of {new Date(weekOf).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })} (Friday)
            </div>
            <button onClick={() => shiftWeek(7)} style={{ padding: "6px 12px", border: `1px solid ${COLORS.line}`, background: "#fff", borderRadius: 2, cursor: "pointer", fontSize: 12.5 }}>Next week →</button>
          </div>

          {cycleLoading ? (
            <div style={{ color: COLORS.slate, fontSize: 13 }}>Loading...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {CYCLE_DAYS.map((d) => {
                const status = cycle?.[`${d.key}_status`] || "pending";
                return (
                  <div key={d.key} style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${d.color}`, padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 15.5, fontWeight: 600, color: COLORS.ink }}>{d.label}</div>
                        <div style={{ fontSize: 11.5, color: COLORS.slate, marginTop: 2 }}>{d.who}</div>
                        <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 4 }}>{d.desc}</div>
                      </div>
                      <button
                        onClick={() => updateCycleField(`${d.key}_status`, status === "done" ? "pending" : "done")}
                        style={{
                          padding: "5px 12px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                          border: `1px solid ${status === "done" ? COLORS.green : COLORS.line}`,
                          background: status === "done" ? COLORS.green : "#fff",
                          color: status === "done" ? "#fff" : COLORS.slate,
                        }}
                      >
                        {status === "done" ? "✓ Done" : "Pending"}
                      </button>
                    </div>

                    {(d.key === "green" || d.key === "blue") && (
                      <textarea
                        defaultValue={cycle?.[`${d.key}_notes`] || ""}
                        onBlur={(e) => updateCycleField(`${d.key}_notes`, e.target.value)}
                        placeholder={d.key === "green" ? "What's planned for Mon–Sat this week..." : "Last week's review, gaps found, corrections, next week's design..."}
                        rows={3}
                        style={{ width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                    )}

                    {d.key === "orange" && (
                      <div>
                        <button onClick={runOrangeAiVerification} disabled={orangeAiLoading} style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: COLORS.ink, color: "#fff",
                          border: "none", borderRadius: 2, fontWeight: 600, fontSize: 12.5, cursor: "pointer", marginBottom: 10,
                        }}>
                          {orangeAiLoading ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
                          {orangeAiLoading ? "Verifying..." : "Run AI Verification"}
                        </button>
                        {cycle?.orange_ai_verification && (
                          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, padding: "10px 12px", fontSize: 12.5, color: COLORS.ink, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                            {cycle.orange_ai_verification}
                          </div>
                        )}
                      </div>
                    )}

                    {d.key === "red" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11.5, color: COLORS.slate, display: "block", marginBottom: 4 }}>Manually verified by (BizZen BFSPI admin)</label>
                          <input
                            defaultValue={cycle?.red_verified_by || ""}
                            onBlur={(e) => updateCycleField("red_verified_by", e.target.value)}
                            placeholder="Admin name"
                            style={{ width: "100%", maxWidth: 300, padding: "8px 10px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }}
                          />
                        </div>
                        <button onClick={runRedOwnerReport} disabled={redAiLoading} style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: COLORS.ink, color: "#fff",
                          border: "none", borderRadius: 2, fontWeight: 600, fontSize: 12.5, cursor: "pointer", alignSelf: "flex-start",
                        }}>
                          {redAiLoading ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
                          {redAiLoading ? "Generating..." : "Generate Owner AI Report (dept-head acceptance)"}
                        </button>
                        {cycle?.red_owner_report && (
                          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, padding: "10px 12px", fontSize: 12.5, color: COLORS.ink, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                            {cycle.red_owner_report}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "meetings" && (
        <div style={{ maxWidth: 900 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <button onClick={exportMeetingsCsv} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: `1px solid ${COLORS.line}`, background: "#fff", borderRadius: 2, fontSize: 12.5, cursor: "pointer" }}>
              <Download size={13} /> Export CSV
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: `1px solid ${COLORS.line}`, background: "#fff", borderRadius: 2, fontSize: 12.5, cursor: "pointer" }}>
              <Upload size={13} /> Import CSV
              <input type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => e.target.files[0] && importMeetingsCsv(e.target.files[0])} />
            </label>
          </div>

          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 15, fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>Schedule a Meeting</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <select value={newMeeting.meeting_type} onChange={(e) => setNewMeeting({ ...newMeeting, meeting_type: e.target.value })}
                style={{ padding: "9px 10px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }}>
                {MEETING_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              <input placeholder="Title" value={newMeeting.title} onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                style={{ flex: "1 1 160px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <input type="datetime-local" value={newMeeting.start_time} onChange={(e) => setNewMeeting({ ...newMeeting, start_time: e.target.value })}
                style={{ padding: "9px 10px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 12.5 }} />
              <input type="datetime-local" value={newMeeting.end_time} onChange={(e) => setNewMeeting({ ...newMeeting, end_time: e.target.value })}
                style={{ padding: "9px 10px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 12.5 }} />
              <input placeholder="Attendees" value={newMeeting.attendees} onChange={(e) => setNewMeeting({ ...newMeeting, attendees: e.target.value })}
                style={{ flex: "1 1 160px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            </div>
            <button onClick={addMeeting} style={{ padding: "9px 18px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Schedule
            </button>
          </div>

          {meetingsLoading ? (
            <div style={{ color: COLORS.slate, fontSize: 13 }}>Loading meetings...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {meetings.map((m) => {
                const typeLabel = MEETING_TYPES.find((t) => t.key === m.meeting_type)?.label || m.meeting_type;
                const isOpen = selectedMeetingId === m.id;
                return (
                  <div key={m.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${COLORS.blueprint}` }}>
                    <button onClick={() => selectMeeting(m.id)} style={{
                      width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
                    }}>
                      <div>
                        <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10, color: COLORS.amber, textTransform: "uppercase", marginRight: 8 }}>{typeLabel}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{m.title}</span>
                        <div style={{ fontSize: 11.5, color: COLORS.slate, marginTop: 3 }}>
                          {m.start_time ? new Date(m.start_time).toLocaleString() : "No start time"} {m.attendees ? `· ${m.attendees}` : ""}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase",
                        color: m.status === "completed" ? COLORS.green : m.status === "in_progress" ? COLORS.amber : COLORS.slate,
                        border: `1px solid ${m.status === "completed" ? COLORS.green : m.status === "in_progress" ? COLORS.amber : COLORS.line}`,
                      }}>
                        {m.status}
                      </span>
                    </button>

                    {isOpen && (
                      <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${COLORS.line}` }}>
                        <div style={{ marginTop: 14, marginBottom: 14 }}>
                          <label style={{ fontSize: 11.5, color: COLORS.slate, display: "block", marginBottom: 5 }}>Agenda / Notes</label>
                          <textarea defaultValue={m.agenda || ""} onBlur={(e) => updateMeeting(m.id, { agenda: e.target.value })}
                            rows={3} style={{ width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                          <button onClick={() => handleCheckIn(m, false)} disabled={!!m.checkin_time} style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 2, cursor: "pointer",
                            border: `1px solid ${COLORS.green}`, background: m.checkin_time ? COLORS.line : "#fff", color: COLORS.green, fontSize: 12.5, fontWeight: 600,
                          }}>
                            <LogIn size={13} /> {m.checkin_time ? `Checked in ${new Date(m.checkin_time).toLocaleTimeString()}` : "Check In"}
                          </button>
                          <button onClick={() => handleCheckIn(m, true)} disabled={!!m.checkin_time || faceIdBusy} style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 2, cursor: "pointer",
                            border: `1px solid ${COLORS.blueprint}`, background: "#fff", color: COLORS.blueprint, fontSize: 12.5, fontWeight: 600,
                          }}>
                            <Fingerprint size={13} /> {faceIdBusy ? "Verifying..." : "Face ID Check-in"}
                          </button>
                          <button onClick={() => handleCheckOut(m)} disabled={!m.checkin_time || !!m.checkout_time} style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 2, cursor: "pointer",
                            border: `1px solid ${COLORS.red}`, background: m.checkout_time ? COLORS.line : "#fff", color: COLORS.red, fontSize: 12.5, fontWeight: 600,
                          }}>
                            <LogOut size={13} /> {m.checkout_time ? `Checked out ${new Date(m.checkout_time).toLocaleTimeString()}` : "Check Out"}
                          </button>
                        </div>

                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(m.id, e.dataTransfer.files); }}
                          style={{
                            border: `2px dashed ${dragOver ? COLORS.blueprint : COLORS.line}`, borderRadius: 4, padding: "20px",
                            textAlign: "center", background: dragOver ? COLORS.blueprintSoft : COLORS.paper, marginBottom: 12,
                          }}
                        >
                          <Paperclip size={18} color={COLORS.slate} style={{ marginBottom: 6 }} />
                          <div style={{ fontSize: 12.5, color: COLORS.slate, marginBottom: 8 }}>
                            Drag &amp; drop voice, video, image, PDF, or any file here
                          </div>
                          <label style={{ display: "inline-block", padding: "7px 14px", background: COLORS.ink, color: "#fff", borderRadius: 2, fontSize: 12, cursor: "pointer" }}>
                            {uploading ? "Uploading..." : "Or choose files"}
                            <input type="file" multiple style={{ display: "none" }} disabled={uploading}
                              onChange={(e) => e.target.files.length && uploadFiles(m.id, e.target.files)} />
                          </label>
                        </div>

                        {attachments.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {attachments.map((a) => {
                              const Icon = fileTypeIcon(a.file_type);
                              return (
                                <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" style={{
                                  display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: `1px solid ${COLORS.line}`,
                                  borderRadius: 2, fontSize: 12.5, color: COLORS.ink, textDecoration: "none",
                                }}>
                                  <Icon size={14} color={COLORS.blueprint} /> {a.file_name}
                                  <span style={{ marginLeft: "auto", fontSize: 10.5, color: COLORS.slate, textTransform: "uppercase" }}>{a.file_type}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {meetings.length === 0 && <div style={{ fontSize: 13, color: COLORS.slate, fontStyle: "italic" }}>No meetings scheduled yet.</div>}
            </div>
          )}
        </div>
      )}

      {tab === "compare" && (
        <div>
          {branches.length === 0 ? (
            <div style={{ fontSize: 13.5, color: COLORS.slate }}>Add branches first (in the "Branches" tab) to compare them.</div>
          ) : compareLoading ? (
            <div style={{ color: COLORS.slate, fontSize: 13 }}>Loading comparison...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(compareData.length, 3)}, 1fr)`, gap: 14 }}>
              {compareData.map(({ branch, teamCount, avgHappiness, taskTotal, taskDone, completionPct }) => (
                <div key={branch.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderTop: `3px solid ${COLORS.blueprint}`, padding: "18px 18px" }}>
                  <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{branch.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 16 }}>{branch.location}</div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: COLORS.slate }}>Task Completion</span>
                      <span style={{ fontWeight: 700, color: COLORS.ink }}>{completionPct == null ? "—" : `${completionPct}%`}</span>
                    </div>
                    <div style={{ height: 7, background: COLORS.paper, borderRadius: 2 }}>
                      <div style={{ width: `${completionPct || 0}%`, height: "100%", background: (completionPct || 0) >= 70 ? COLORS.green : COLORS.amber, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.slate, marginTop: 3 }}>{taskDone}/{taskTotal} tasks done</div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${COLORS.line}` }}>
                    <span style={{ fontSize: 12.5, color: COLORS.slate }}>Team Size</span>
                    <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.ink }}>{teamCount}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${COLORS.line}` }}>
                    <span style={{ fontSize: 12.5, color: COLORS.slate }}>Avg. Happiness</span>
                    <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.ink }}>
                      {avgHappiness == null ? "—" : `${avgHappiness.toFixed(1)}/10`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "krakpi" && (
        <div style={{ maxWidth: 950 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {["kra", "kpi"].map((k) => (
              <button key={k} onClick={() => setKrakpiFilter(k)} style={{
                padding: "7px 16px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${krakpiFilter === k ? COLORS.blueprint : COLORS.line}`,
                background: krakpiFilter === k ? COLORS.blueprint : "#fff",
                color: krakpiFilter === k ? "#fff" : COLORS.slate,
              }}>
                {k === "kra" ? "KRA — Key Result Areas" : "KPI — Key Performance Indicators"}
              </button>
            ))}
          </div>

          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <input placeholder={krakpiFilter === "kra" ? "KRA title — e.g. Sales Growth" : "KPI title — e.g. Lead Conversion Rate"}
                value={newKrakpi.title} onChange={(e) => setNewKrakpi({ ...newKrakpi, title: e.target.value })}
                style={{ flex: "2 1 200px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
              <input placeholder="Department" value={newKrakpi.department} onChange={(e) => setNewKrakpi({ ...newKrakpi, department: e.target.value })}
                style={{ flex: "1 1 130px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
              <input placeholder="Period (e.g. Aug 2026)" value={newKrakpi.period} onChange={(e) => setNewKrakpi({ ...newKrakpi, period: e.target.value })}
                style={{ flex: "1 1 130px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input type="number" placeholder="Target" value={newKrakpi.target} onChange={(e) => setNewKrakpi({ ...newKrakpi, target: e.target.value })}
                style={{ width: 100, padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
              <input type="number" placeholder="Actual" value={newKrakpi.actual} onChange={(e) => setNewKrakpi({ ...newKrakpi, actual: e.target.value })}
                style={{ width: 100, padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
              <select value={newKrakpi.unit} onChange={(e) => setNewKrakpi({ ...newKrakpi, unit: e.target.value })}
                style={{ padding: "9px 10px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }}>
                <option value="%">%</option>
                <option value="Rs">Rs</option>
                <option value="count">count</option>
              </select>
              <button onClick={addKrakpi} style={{ padding: "9px 18px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                Add {krakpiFilter.toUpperCase()}
              </button>
            </div>
          </div>

          {krakpiLoading ? (
            <div style={{ color: COLORS.slate, fontSize: 13 }}>Loading...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 800 }}>
                <thead>
                  <tr>
                    {["Title", "Department", "Period", "Target", "Actual", "% Achieved", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, color: COLORS.slate, borderBottom: `1px solid ${COLORS.line}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {krakpiRows.filter((r) => r.item_type === krakpiFilter).map((r) => {
                    const pct = (r.target != null && r.target !== 0 && r.actual != null) ? (r.actual / r.target) * 100 : null;
                    return (
                      <tr key={r.id}>
                        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{r.title}</td>
                        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12.5, color: COLORS.slate }}>{r.department}</td>
                        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12.5, color: COLORS.slate }}>{r.period}</td>
                        <td style={{ padding: "6px 8px", borderBottom: `1px solid ${COLORS.line}` }}>
                          <input type="number" defaultValue={r.target ?? ""} onBlur={(e) => updateKrakpi(r.id, "target", e.target.value)}
                            style={{ width: 70, padding: "5px 7px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 12.5 }} /> {r.unit}
                        </td>
                        <td style={{ padding: "6px 8px", borderBottom: `1px solid ${COLORS.line}` }}>
                          <input type="number" defaultValue={r.actual ?? ""} onBlur={(e) => updateKrakpi(r.id, "actual", e.target.value)}
                            style={{ width: 70, padding: "5px 7px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 12.5 }} /> {r.unit}
                        </td>
                        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13, fontWeight: 700, color: pct == null ? COLORS.slate : pct >= 90 ? COLORS.green : pct >= 60 ? COLORS.amber : COLORS.red }}>
                          {pct == null ? "—" : `${pct.toFixed(0)}%`}
                        </td>
                        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.line}` }}>
                          <button onClick={() => deleteKrakpi(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.slate }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {krakpiRows.filter((r) => r.item_type === krakpiFilter).length === 0 && (
                    <tr><td colSpan={7} style={{ padding: "14px 10px", fontSize: 13, color: COLORS.slate, fontStyle: "italic" }}>
                      No {krakpiFilter.toUpperCase()} rows yet — add one above.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "journey" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 800 }}>
          {stages.map((s, i) => {
            const meta = JOURNEY_STAGES.find((j) => j.key === s.stage_key) || {};
            return (
              <div key={s.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${COLORS.blueprint}`, padding: "13px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.amber, fontWeight: 700 }}>STAGE {i + 1}</div>
                    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 14.5, color: COLORS.ink, margin: "2px 0" }}>{meta.label}</div>
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
                    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>{meta.label}</div>
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
              style={{ flex: 1, padding: "9px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13.5, resize: "vertical", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
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
