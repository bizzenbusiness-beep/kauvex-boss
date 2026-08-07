import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";
import { IndianRupee, TrendingUp, Users, Wallet } from "lucide-react";
import { supabase } from "./lib/supabaseClient.js";

const FONT_SERIF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const COLORS = {
  ink: "#111111",
  paper: "#F7F5F0",
  card: "#FFFFFF",
  blueprint: "#A8792F",
  amber: "#A8792F",
  slate: "#7A7568",
  green: "#2F7D52",
  red: "#B23B2E",
  line: "#E7E2D6",
};

function CornerFrame({ children, style = {} }) {
  return (
    <div style={{ background: COLORS.card, borderRadius: 2, border: `1px solid ${COLORS.line}`, ...style }}>
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11, letterSpacing: 1.5, color: COLORS.amber, textTransform: "uppercase", marginBottom: 4 }}>
        {eyebrow}
      </div>
      <h2 style={{ fontFamily: FONT_SERIF, fontSize: 24, fontWeight: 600, color: COLORS.ink, margin: 0 }}>{title}</h2>
    </div>
  );
}

function IconBadge({ Icon, tint }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      background: tint + "1A", marginBottom: 10,
    }}>
      <Icon size={16} color={tint} />
    </div>
  );
}

function KpiTile({ label, value, unit, icon: Icon, tint }) {
  return (
    <CornerFrame style={{ background: COLORS.card, padding: "20px 18px", flex: 1, minWidth: 180 }}>
      {Icon && <IconBadge Icon={Icon} tint={tint || COLORS.blueprint} />}
      <div style={{ fontFamily: FONT_SANS, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: COLORS.slate }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: 28, fontWeight: 600, color: COLORS.ink }}>{value}</span>
        {unit && <span style={{ fontFamily: FONT_SERIF, fontSize: 14, color: COLORS.slate }}>{unit}</span>}
      </div>
    </CornerFrame>
  );
}

function NoDataNote({ children }) {
  return (
    <div style={{ fontSize: 12.5, color: COLORS.slate, fontStyle: "italic", padding: "20px 0" }}>
      {children}
    </div>
  );
}

// Turn a JS Date into the first-of-month "YYYY-MM-01" string monthly_metrics.month expects.
function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function MeasureMonitor({ companyId }) {
  const [loading, setLoading] = useState(true);
  const [thisMonthRows, setThisMonthRows] = useState([]);
  const [trendRows, setTrendRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState(null);
  const [draft, setDraft] = useState({
    function_name: "", target: "", actual: "", leads_generated: "", leads_closed: "", revenue: "", expenses: "",
  });

  async function load() {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);

    const now = new Date();
    const thisMonth = monthKey(now);
    const sixMonthsAgo = monthKey(new Date(now.getFullYear(), now.getMonth() - 5, 1));

    const [{ data: current }, { data: trend }] = await Promise.all([
      supabase.from("monthly_metrics").select("*").eq("company_id", companyId).eq("month", thisMonth),
      supabase.from("monthly_metrics").select("*").eq("company_id", companyId).gte("month", sixMonthsAgo).order("month", { ascending: true }),
    ]);

    setThisMonthRows(current || []);
    setTrendRows(trend || []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [companyId]);

  async function submitNumbers() {
    setFormErr(null);
    if (!draft.function_name.trim()) { setFormErr("Function/department name is required."); return; }
    setSaving(true);
    const now = new Date();
    const { error } = await supabase.from("monthly_metrics").insert({
      company_id: companyId,
      month: monthKey(now),
      function_name: draft.function_name.trim(),
      target: Number(draft.target) || 0,
      actual: Number(draft.actual) || 0,
      leads_generated: Number(draft.leads_generated) || 0,
      leads_closed: Number(draft.leads_closed) || 0,
      revenue: Number(draft.revenue) || 0,
      expenses: Number(draft.expenses) || 0,
    });
    setSaving(false);
    if (error) { setFormErr(error.message); return; }
    setDraft({ function_name: "", target: "", actual: "", leads_generated: "", leads_closed: "", revenue: "", expenses: "" });
    setShowForm(false);
    load();
  }

  const sum = (rows, key) => rows.reduce((total, r) => total + (Number(r[key]) || 0), 0);

  const leadsGenerated = sum(thisMonthRows, "leads_generated");
  const leadsClosed = sum(thisMonthRows, "leads_closed");
  const revenue = sum(thisMonthRows, "revenue");
  const expenses = sum(thisMonthRows, "expenses");
  const conversionRate = leadsGenerated > 0 ? ((leadsClosed / leadsGenerated) * 100).toFixed(1) : "0";
  const netProfit = revenue - expenses;

  // Group trend rows by month for the chart (summing across any per-function rows within a month).
  const trendByMonth = {};
  trendRows.forEach((r) => {
    const key = r.month;
    if (!trendByMonth[key]) trendByMonth[key] = { month: key, leads: 0, revenue: 0 };
    trendByMonth[key].leads += Number(r.leads_generated) || 0;
    trendByMonth[key].revenue += Number(r.revenue) || 0;
  });
  const trend = Object.values(trendByMonth).map((t) => ({
    ...t,
    monthLabel: new Date(t.month).toLocaleDateString(undefined, { month: "short" }),
  }));

  // Per-function target vs actual, this month only.
  const funcs = thisMonthRows
    .filter((r) => r.function_name)
    .map((r) => ({ name: r.function_name, target: Number(r.target) || 0, actual: Number(r.actual) || 0 }));

  if (!companyId) {
    return (
      <div>
        <SectionHeading eyebrow="Module 04" title="Measure & Monitor" />
        <NoDataNote>No company selected — use the Viewing Client switcher above.</NoDataNote>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <SectionHeading eyebrow="Module 04" title="Measure & Monitor" />
        <div style={{ color: COLORS.slate, fontSize: 13 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <SectionHeading eyebrow="Module 04" title="Measure & Monitor" />
        <button onClick={() => setShowForm((s) => !s)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: COLORS.ink, color: "#fff",
          border: "none", borderRadius: 2, fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          + Add This Month's Numbers
        </button>
      </div>

      {showForm && (
        <CornerFrame style={{ padding: 18, marginBottom: 18 }}>
          {formErr && <div style={{ fontSize: 12, color: COLORS.red, marginBottom: 10 }}>{formErr}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input placeholder="Function (e.g. Marketing, Sales)" value={draft.function_name}
              onChange={(e) => setDraft({ ...draft, function_name: e.target.value })}
              style={{ flex: "1 1 180px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <input type="number" placeholder="Target" value={draft.target}
              onChange={(e) => setDraft({ ...draft, target: e.target.value })}
              style={{ flex: "1 1 90px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <input type="number" placeholder="Actual" value={draft.actual}
              onChange={(e) => setDraft({ ...draft, actual: e.target.value })}
              style={{ flex: "1 1 90px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <input type="number" placeholder="Leads generated" value={draft.leads_generated}
              onChange={(e) => setDraft({ ...draft, leads_generated: e.target.value })}
              style={{ flex: "1 1 130px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <input type="number" placeholder="Leads closed" value={draft.leads_closed}
              onChange={(e) => setDraft({ ...draft, leads_closed: e.target.value })}
              style={{ flex: "1 1 120px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <input type="number" placeholder="Revenue (₹)" value={draft.revenue}
              onChange={(e) => setDraft({ ...draft, revenue: e.target.value })}
              style={{ flex: "1 1 120px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <input type="number" placeholder="Expenses (₹)" value={draft.expenses}
              onChange={(e) => setDraft({ ...draft, expenses: e.target.value })}
              style={{ flex: "1 1 120px", padding: "9px 11px", border: `1px solid ${COLORS.line}`, borderRadius: 2, fontSize: 13 }} />
            <button onClick={submitNumbers} disabled={saving} style={{
              padding: "9px 16px", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2,
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </CornerFrame>
      )}

      {thisMonthRows.length === 0 && trendRows.length === 0 ? (
        <CornerFrame style={{ padding: "24px 20px", marginBottom: 22 }}>
          <NoDataNote>
            No monthly numbers recorded yet for this company. Once entries are added to the monthly metrics
            tracker, real leads/revenue/conversion figures will appear here.
          </NoDataNote>
        </CornerFrame>
      ) : (
        <>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
            <KpiTile label="Leads Generated" value={leadsGenerated} icon={Users} tint={COLORS.blueprint} />
            <KpiTile label="Conversion Rate" value={conversionRate} unit="%" icon={TrendingUp} tint={COLORS.amber} />
            <KpiTile label="Revenue (this month)" value={`₹${revenue.toLocaleString("en-IN")}`} icon={IndianRupee} tint={COLORS.green} />
            <KpiTile label="Net Profit (this month)" value={`₹${netProfit.toLocaleString("en-IN")}`} icon={Wallet} tint={COLORS.blueprint} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 22 }}>
            <CornerFrame style={{ padding: "18px 20px" }}>
              <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 14, color: COLORS.ink, marginBottom: 2 }}>
                Leads &amp; Revenue Trend
              </div>
              <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 12 }}>Last 6 months</div>
              {trend.length === 0 ? (
                <NoDataNote>No monthly history recorded yet.</NoDataNote>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={COLORS.line} vertical={false} />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 2, border: `1px solid ${COLORS.line}`, fontSize: 12.5 }} />
                    <Line type="monotone" dataKey="leads" name="Leads" stroke={COLORS.blueprint} strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.green} strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CornerFrame>

            <CornerFrame style={{ padding: "18px 20px" }}>
              <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 14, color: COLORS.ink, marginBottom: 2 }}>
                Business Health
              </div>
              <NoDataNote>
                No data source for a health score yet — needs a defined formula and inputs before this can
                show a real number.
              </NoDataNote>
            </CornerFrame>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 22 }}>
            <CornerFrame style={{ padding: "18px 20px" }}>
              <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 14, color: COLORS.ink, marginBottom: 2 }}>
                Revenue → Net Profit
              </div>
              <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 16 }}>This month, from recorded revenue and expenses</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: COLORS.ink }}>Revenue</span>
                  <span style={{ fontFamily: FONT_SANS, fontWeight: 600 }}>₹{revenue.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: COLORS.red }}>Expenses</span>
                  <span style={{ fontFamily: FONT_SANS, fontWeight: 600, color: COLORS.red }}>-₹{expenses.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderTop: `1px solid ${COLORS.line}`, paddingTop: 10 }}>
                  <span style={{ color: COLORS.ink, fontWeight: 700 }}>Net Profit</span>
                  <span style={{ fontFamily: FONT_SANS, fontWeight: 700, color: COLORS.blueprint }}>₹{netProfit.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </CornerFrame>

            <CornerFrame style={{ padding: "18px 20px" }}>
              <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 14, color: COLORS.ink, marginBottom: 2 }}>Financial Health</div>
              <NoDataNote>
                Assets, liabilities, and debt-to-asset need a dedicated finance table — not tracked yet.
              </NoDataNote>
            </CornerFrame>
          </div>

          <CornerFrame style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 14, color: COLORS.ink, marginBottom: 2 }}>
              Target vs Actual — This Month
            </div>
            <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 12 }}>By function</div>
            {funcs.length === 0 ? (
              <NoDataNote>No per-function targets recorded for this month yet.</NoDataNote>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funcs} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={COLORS.line} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 2, border: `1px solid ${COLORS.line}`, fontSize: 12.5 }} />
                  <Bar dataKey="target" name="Target" fill={COLORS.line} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill={COLORS.blueprint} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CornerFrame>
        </>
      )}
    </div>
  );
}
