import React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import { IndianRupee, CreditCard, TrendingUp, Users, Wallet, ShieldCheck } from "lucide-react";

const FONT_SERIF = "'Fraunces', Georgia, serif";
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

function KpiTile({ label, value, unit, delta, icon: Icon, tint }) {
  const up = delta >= 0;
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
      <div style={{ fontFamily: FONT_SANS, fontSize: 11, marginTop: 8, letterSpacing: 0.3, color: up ? COLORS.green : COLORS.red }}>
        {up ? "▲" : "▼"} {Math.abs(delta)}% vs last month
      </div>
    </CornerFrame>
  );
}

export default function MeasureMonitor() {
  const funcs = [
    { name: "Marketing", target: 40, actual: 27 },
    { name: "Sales", target: 12, actual: 8 },
    { name: "Operations", target: 90, actual: 76 },
    { name: "Accounts", target: 100, actual: 94 },
  ];
  const trend = [
    { month: "Feb", leads: 14, revenue: 5.1 },
    { month: "Mar", leads: 18, revenue: 5.9 },
    { month: "Apr", leads: 16, revenue: 6.4 },
    { month: "May", leads: 21, revenue: 7.0 },
    { month: "Jun", leads: 24, revenue: 7.6 },
    { month: "Jul", leads: 27, revenue: 8.4 },
  ];
  const healthScore = 82;
  const gaugeData = [{ name: "Health", value: healthScore, fill: healthScore >= 70 ? COLORS.green : COLORS.amber }];

  // Revenue -> Cash Profit waterfall (monthly, in Lakhs — consistent with Revenue MTD KPI tile)
  const waterfall = [
    { label: "Revenue", value: 8.40, kind: "total" },
    { label: "Cost of goods", value: -3.20, kind: "deduct" },
    { label: "Gross Profit", value: 5.20, kind: "subtotal" },
    { label: "Operating + tax", value: -2.69, kind: "deduct" },
    { label: "Net Profit", value: 2.51, kind: "subtotal" },
    { label: "Receivables / non-cash", value: -0.45, kind: "deduct" },
    { label: "Cash Profit", value: 2.06, kind: "final" },
  ];
  const maxAbs = Math.max(...waterfall.map((w) => Math.abs(w.value)));
  const netMargin = ((2.51 / 8.40) * 100).toFixed(1);
  const cashRealisation = ((2.06 / 2.51) * 100).toFixed(0);

  return (
    <div>
      <SectionHeading eyebrow="Module 04" title="Measure & Monitor" />

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <KpiTile label="Leads Generated" value="27" delta={12} icon={Users} tint={COLORS.blueprint} />
        <KpiTile label="Conversion Rate" value="19.4" unit="%" delta={-3} icon={TrendingUp} tint={COLORS.amber} />
        <KpiTile label="Revenue MTD" value="8.4L" delta={6} icon={IndianRupee} tint={COLORS.green} />
        <KpiTile label="Cash Profit · In Hand" value="2.06L" delta={4} icon={Wallet} tint={COLORS.blueprint} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 22 }}>
        <CornerFrame style={{ padding: "18px 20px" }}>
          <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 14, color: COLORS.ink, marginBottom: 2 }}>
            Leads &amp; Revenue Trend
          </div>
          <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 12 }}>Last 6 months</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.line} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 2, border: `1px solid ${COLORS.line}`, fontSize: 12.5 }} />
              <Line type="monotone" dataKey="leads" name="Leads" stroke={COLORS.blueprint} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="revenue" name="Revenue (L)" stroke={COLORS.green} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CornerFrame>

        <CornerFrame style={{ padding: "18px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 14, color: COLORS.ink, alignSelf: "flex-start" }}>
            Business Health
          </div>
          <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 4, alignSelf: "flex-start" }}>Overall score</div>
          <ResponsiveContainer width="100%" height={170}>
            <RadialBarChart innerRadius="72%" outerRadius="100%" data={gaugeData} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: COLORS.line }} dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: -100, fontFamily: FONT_SERIF, fontSize: 30, fontWeight: 700, color: COLORS.ink }}>{healthScore}</div>
          <div style={{ marginTop: 90, marginBottom: 14, fontSize: 12, fontWeight: 600, color: healthScore >= 70 ? COLORS.green : COLORS.amber, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {healthScore >= 70 ? "Healthy" : "Needs Attention"}
          </div>
          <div style={{ width: "100%", borderTop: `1px solid ${COLORS.line}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: COLORS.slate }}>Net margin</span>
              <span style={{ fontFamily: FONT_SANS, fontWeight: 600, color: COLORS.green }}>{netMargin}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: COLORS.slate }}>Cash realisation</span>
              <span style={{ fontFamily: FONT_SANS, fontWeight: 600, color: COLORS.blueprint }}>{cashRealisation}%</span>
            </div>
          </div>
        </CornerFrame>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 22 }}>
        <CornerFrame style={{ padding: "18px 20px" }}>
          <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 14, color: COLORS.ink, marginBottom: 2 }}>
            Revenue → Cash Profit
          </div>
          <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 16 }}>How every rupee of revenue becomes cash in hand — this month</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {waterfall.map((w) => {
              const isDeduct = w.kind === "deduct";
              const pct = Math.min(100, (Math.abs(w.value) / maxAbs) * 100);
              const barColor = w.kind === "final" ? COLORS.blueprint : w.kind === "subtotal" ? COLORS.ink : isDeduct ? COLORS.red : COLORS.slate;
              return (
                <div key={w.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ color: isDeduct ? COLORS.red : COLORS.ink, fontWeight: w.kind === "final" ? 700 : 500 }}>{w.label}</span>
                    <span style={{ fontFamily: FONT_SANS, color: isDeduct ? COLORS.red : COLORS.ink, fontWeight: 600 }}>
                      {isDeduct ? "-" : ""}₹{Math.abs(w.value).toFixed(2)}L
                    </span>
                  </div>
                  {!isDeduct && (
                    <div style={{ height: 8, background: COLORS.paper, borderRadius: 2 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CornerFrame>

        <CornerFrame style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <ShieldCheck size={15} color={COLORS.blueprint} />
            <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 14, color: COLORS.ink }}>Financial Health</div>
          </div>
          <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 16 }}>Margin, cash realisation &amp; debt — combined</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.line}` }}>
              <span style={{ fontSize: 12.5, color: COLORS.slate }}>Total Assets</span>
              <span style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>₹1.76Cr</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.line}` }}>
              <span style={{ fontSize: 12.5, color: COLORS.slate }}>Total Liabilities</span>
              <span style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 700, color: COLORS.red }}>₹75.69L</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
              <span style={{ fontSize: 12.5, color: COLORS.slate }}>Debt-to-Asset</span>
              <span style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 700, color: COLORS.green }}>43%</span>
            </div>
          </div>
        </CornerFrame>
      </div>

      <CornerFrame style={{ padding: "18px 20px" }}>
        <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 14, color: COLORS.ink, marginBottom: 2 }}>
          Target vs Actual — This Month
        </div>
        <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 12 }}>By function</div>
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
      </CornerFrame>
    </div>
  );
}
