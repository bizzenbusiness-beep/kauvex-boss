import React, { useEffect, useState } from "react";
import { ChevronLeft, Save, Plus, Trash2, Loader2, CheckCircle2, FileText } from "lucide-react";
import { supabase } from "../lib/supabaseClient.js";
import { FORM_GROUPS, findForm } from "./formSchemas.js";

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

const inputStyle = {
  width: "100%", padding: "9px 11px", border: `1px solid ${COLORS.line}`,
  borderRadius: 2, fontFamily: "Inter", fontSize: 13.5, boxSizing: "border-box",
  background: "#fffef8",
};

function RatingGroup({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 18, marginTop: 6 }}>
      {options.map((opt) => (
        <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.ink, cursor: "pointer" }}>
          <input type="radio" checked={value === opt} onChange={() => onChange(opt)} />
          {opt}
        </label>
      ))}
    </div>
  );
}

function DynamicTable({ columns, rows, onChange, fixedRows, fixedLabels }) {
  const total = fixedRows || (fixedLabels ? fixedLabels.length : Math.max(rows.length, 1));

  useEffect(() => {
    if (rows.length < total) {
      const extra = Array.from({ length: total - rows.length }, () => ({}));
      onChange([...rows, ...extra]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateCell(i, key, val) {
    const next = rows.slice();
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  }
  function addRow() { onChange([...rows, {}]); }
  function removeRow(i) { onChange(rows.filter((_, idx) => idx !== i)); }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: "left", fontSize: 11, color: COLORS.slate, padding: "4px 6px", borderBottom: `1px solid ${COLORS.line}`, whiteSpace: "nowrap" }}>
                {c.label}
              </th>
            ))}
            {!fixedRows && !fixedLabels && <th style={{ width: 30 }} />}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, total).map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: "3px 6px", minWidth: 110 }}>
                  {c.readonlyIndex ? (
                    <div style={{ fontSize: 13, color: COLORS.ink, padding: "6px 2px" }}>
                      {fixedLabels ? fixedLabels[i] : i + 1}
                    </div>
                  ) : (
                    <input
                      value={row[c.key] || ""}
                      onChange={(e) => updateCell(i, c.key, e.target.value)}
                      style={{ ...inputStyle, padding: "6px 8px", fontSize: 12.5 }}
                    />
                  )}
                </td>
              ))}
              {!fixedRows && !fixedLabels && (
                <td>
                  <button onClick={() => removeRow(i)} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.red }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!fixedRows && !fixedLabels && (
        <button
          onClick={addRow}
          style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, border: `1px dashed ${COLORS.line}`, background: "none", borderRadius: 2, padding: "6px 10px", fontSize: 12.5, color: COLORS.blueprint, cursor: "pointer" }}
        >
          <Plus size={13} /> Add row
        </button>
      )}
    </div>
  );
}

function FieldRenderer({ field, value, onChange }) {
  if (field.type === "rating") {
    const v = value || {};
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginBottom: 4 }}>{field.label}</div>
        <RatingGroup options={field.options} value={v.rating} onChange={(val) => onChange({ ...v, rating: val })} />
        {field.withNotes && (
          <textarea
            placeholder="Notes / observations..."
            value={v.notes || ""}
            onChange={(e) => onChange({ ...v, notes: e.target.value })}
            rows={2}
            style={{ ...inputStyle, marginTop: 8, resize: "vertical" }}
          />
        )}
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div style={{ marginBottom: 18 }}>
        {field.label && <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginBottom: 6 }}>{field.label}</div>}
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>
    );
  }
  if (field.type === "table") {
    return (
      <div style={{ marginBottom: 22 }}>
        {field.label && <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginBottom: 4 }}>{field.label}</div>}
        <DynamicTable
          columns={field.columns}
          rows={Array.isArray(value) ? value : []}
          onChange={onChange}
          fixedRows={field.fixedRows}
          fixedLabels={field.fixedLabels}
        />
      </div>
    );
  }
  // text
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginBottom: 6 }}>{field.label}</div>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}

function FormEditor({ formDef, companyId, userId, onBack }) {
  const [rowId, setRowId] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("form_entries")
      .select("*")
      .eq("company_id", companyId)
      .eq("form_type", formDef.key)
      .order("updated_at", { ascending: false })
      .limit(1)
      .then(({ data: rows }) => {
        if (cancelled) return;
        if (rows && rows.length) {
          setRowId(rows[0].id);
          setData(rows[0].data || {});
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [formDef.key, companyId]);

  function updateField(key, val) {
    setData((d) => ({ ...d, [key]: val }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (rowId) {
      await supabase.from("form_entries").update({ data, updated_by: userId }).eq("id", rowId);
    } else {
      const { data: inserted } = await supabase
        .from("form_entries")
        .insert({ company_id: companyId, form_type: formDef.key, data, created_by: userId, updated_by: userId })
        .select()
        .single();
      if (inserted) setRowId(inserted.id);
    }
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: COLORS.slate, fontSize: 13, marginBottom: 14, padding: 0 }}
      >
        <ChevronLeft size={15} /> Back to forms
      </button>

      <h2 style={{ fontFamily: "Space Grotesk", fontSize: 21, fontWeight: 600, color: COLORS.ink, marginBottom: 18 }}>
        {formDef.title}
      </h2>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.slate, fontSize: 13 }}>
          <Loader2 size={15} className="spin" /> Loading...
        </div>
      ) : (
        <div style={{ maxWidth: 900 }}>
          {formDef.fields.map((f) => (
            <FieldRenderer key={f.key} field={f} value={data[f.key]} onChange={(v) => updateField(f.key, v)} />
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
                background: COLORS.ink, color: "#fff", border: "none", borderRadius: 2,
                fontFamily: "Inter", fontWeight: 600, fontSize: 13.5, cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
              {saving ? "Saving..." : "Save"}
            </button>
            {saved && !saving && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, color: COLORS.green, fontSize: 13 }}>
                <CheckCircle2 size={14} /> Saved
              </span>
            )}
          </div>
        </div>
      )}
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function FormsModule({ companyId, userId }) {
  const [selectedKey, setSelectedKey] = useState(null);

  if (!companyId) {
    return (
      <div style={{ fontSize: 13.5, color: COLORS.slate }}>
        No company selected yet. Kauvex staff: company switching for the
        Forms module is coming soon — for now this links to your own
        profile's company.
      </div>
    );
  }

  if (selectedKey) {
    const formDef = findForm(selectedKey);
    return <FormEditor formDef={formDef} companyId={companyId} userId={userId} onBack={() => setSelectedKey(null)} />;
  }

  return (
    <div>
      <div style={{ fontFamily: "IBM Plex Mono", fontSize: 11, letterSpacing: 1.2, color: COLORS.amber, textTransform: "uppercase", marginBottom: 4 }}>
        Module 06
      </div>
      <h2 style={{ fontFamily: "Space Grotesk", fontSize: 24, fontWeight: 600, color: COLORS.ink, marginBottom: 22 }}>
        Forms & Trackers
      </h2>

      {FORM_GROUPS.map((g) => (
        <div key={g.group} style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "IBM Plex Mono", fontSize: 11.5, letterSpacing: 0.6, color: COLORS.slate, textTransform: "uppercase", marginBottom: 10 }}>
            {g.group}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {g.forms.map((f) => (
              <button
                key={f.key}
                onClick={() => setSelectedKey(f.key)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left",
                  background: COLORS.card, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${COLORS.blueprint}`,
                  padding: "12px 14px", borderRadius: 2, cursor: "pointer",
                }}
              >
                <FileText size={16} color={COLORS.blueprint} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontFamily: "Inter", fontSize: 13.5, color: COLORS.ink, fontWeight: 500 }}>{f.title}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
