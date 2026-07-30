// Schema-driven definitions for every fillable form from:
//  - Business Diagnostic & Growth System Toolkit
//  - Business Health Checkup - Diagnostic Form
//  - System Rollout & Reporting Pack
//
// Field types supported by FormRenderer:
//  'text'      - single-line input
//  'textarea'  - multi-line input
//  'rating'    - radio group (options array)
//  'table'     - dynamic rows, each row has `columns` (array of {key,label,type})

export const RATING4 = ["Poor", "Average", "Good", "Excellent"];
export const SEVERITY4 = ["Low", "Medium", "High", "Critical"];

export const FORM_GROUPS = [
  {
    group: "Business Diagnostic & Growth System Toolkit",
    forms: [
      {
        key: "business_diagnostic_audit",
        title: "A. Business Diagnostic Audit",
        fields: [
          "Revenue & Expense Audit", "Cash Flow Position", "Pricing & Profitability Analysis",
          "Marketing Channel Effectiveness", "Sales Pipeline Review", "Customer Satisfaction Score",
          "Team Structure Analysis", "Operation System Analysis",
        ].map((label, i) => ({ key: `item_${i + 1}`, label, type: "rating", options: RATING4, withNotes: true })),
      },
      {
        key: "gap_identification",
        title: "B. Gap Identification",
        fields: [
          "Missing Systems & Processes", "Finance Leakage Areas", "Team Accountability Gaps",
          "Operational Bottlenecks", "Marketing Blind Spots", "Owner Dependency Points",
        ].map((label, i) => ({ key: `item_${i + 1}`, label, type: "rating", options: SEVERITY4, withNotes: true })),
      },
      {
        key: "priority_mapping",
        title: "C. Priority Mapping",
        fields: [
          "Critical Issues (act now)", "Non-Critical Issues (can wait)", "Resource Allocation Plan",
          "Quick Wins Identified", "Timeline Created", "Long-term System Needs", "Stakeholder Alignment Notes",
        ].map((label, i) => ({ key: `item_${i + 1}`, label, type: "textarea" })),
      },
      {
        key: "system_creation_plan",
        title: "D. System Creation Plan",
        fields: [
          "20 Code Lines Mapping", "Performance Dashboards Design", "Boss Backbone Setup",
          "Team Roles Clarification", "SOP Creation Priority", "Implementation Roadmap",
        ].map((label, i) => ({ key: `item_${i + 1}`, label, type: "textarea" })),
      },
      {
        key: "vision_mission_action",
        title: "E. Vision - Mission - Action Alignment",
        fields: [
          { key: "vision", label: "Vision Alignment (where the owner wants the business to reach)", type: "textarea" },
          { key: "mission", label: "Mission Alignment (how we get there - daily purpose)", type: "textarea" },
          { key: "action", label: "Action Alignment (what is actually being done day to day)", type: "textarea" },
          {
            key: "respect_reject_table", label: "Respect vs Reject Tracker", type: "table",
            columns: [
              { key: "rule", label: "Rule / Role Given" },
              { key: "member", label: "Team Member" },
              { key: "status", label: "Respected / Rejected" },
              { key: "reason", label: "Reason if Rejected" },
            ],
          },
        ],
      },
      {
        key: "objective_gap_tracker",
        title: "F. Objective / Role / Rule vs Implementation Gap Tracker",
        fields: [
          {
            key: "rows", label: "", type: "table",
            columns: [
              { key: "objective", label: "Objective/Target" },
              { key: "role", label: "Role Assigned" },
              { key: "rule", label: "Rule Given" },
              { key: "implemented", label: "Implemented? (Y/Partial/N)" },
              { key: "gap", label: "Gap / Reason" },
              { key: "action", label: "Corrective Action" },
            ],
          },
        ],
      },
      {
        key: "monthly_numbers_tracker",
        title: "G. Monthly Numbers Tracker",
        fields: [
          {
            key: "rows", label: "", type: "table",
            columns: [
              { key: "month", label: "Month" },
              { key: "target", label: "Target/Goal" },
              { key: "actual", label: "Actual" },
              { key: "benchmark", label: "Benchmark" },
              { key: "breakeven", label: "Break-even (Rs)" },
              { key: "leads_gen", label: "Leads Generated" },
              { key: "leads_closed", label: "Leads Closed" },
              { key: "conversion", label: "Conversion %" },
            ],
          },
        ],
      },
      {
        key: "signup_day_tracker",
        title: "H. 20-Day Sign-up Implementation Tracker",
        fields: [
          {
            key: "rows", label: "", type: "table", fixedRows: 20,
            columns: [
              { key: "day", label: "Day", readonlyIndex: true },
              { key: "task", label: "Task / Milestone" },
              { key: "owner", label: "Owner" },
              { key: "done", label: "Done (Y/N)" },
              { key: "date", label: "Date" },
              { key: "notes", label: "Notes" },
            ],
          },
        ],
      },
      {
        key: "site_visit_form",
        title: "I. Site Visit Form",
        fields: [
          { key: "date_of_visit", label: "Date of Visit", type: "text" },
          { key: "visited_by", label: "Visited By", type: "text" },
          { key: "location", label: "Site / Location", type: "text" },
          ...[
            "Production / Site Setup Observed", "Office & Admin Setup", "Warehouse / Store (if any)",
            "Team Present During Visit", "Owner Availability & Involvement", "Issues Noted On-site",
            "Client Expectations Discussed", "Recommendations After Visit",
          ].map((label, i) => ({ key: `item_${i + 1}`, label, type: "textarea" })),
        ],
      },
      {
        key: "hr_happiness_form",
        title: "J. HR Happiness & Value Creation Form",
        fields: [
          {
            key: "rows", label: "", type: "table",
            columns: [
              { key: "name", label: "Name" },
              { key: "role", label: "Role" },
              { key: "happiness", label: "Happiness (1-10)" },
              { key: "motivates", label: "What Motivates Them" },
              { key: "value", label: "Value They Create" },
              { key: "growth", label: "Growth Area / Support Needed" },
            ],
          },
        ],
      },
      {
        key: "monthly_function_dashboard",
        title: "K. Monthly 7-Function Tracking Dashboard",
        fields: [
          { key: "month", label: "Month", type: "text" },
          {
            key: "rows", label: "", type: "table",
            fixedLabels: ["Marketing", "Sales", "Operations", "HR", "Accounts", "Management", "R&D"],
            columns: [
              { key: "function", label: "Function", readonlyIndex: true },
              { key: "target", label: "Target" },
              { key: "actual", label: "Actual" },
              { key: "variance", label: "Variance" },
              { key: "bizzen", label: "Delivered by BIZZEN" },
              { key: "client", label: "Delivered by Client" },
              { key: "focus", label: "Next Month Focus" },
            ],
          },
        ],
      },
    ],
  },
  {
    group: "Business Health Checkup",
    forms: [
      {
        key: "business_health_checkup",
        title: "Business Health Checkup - Diagnostic Form",
        fields: [
          { key: "owner_present", label: "Owner Present", type: "text" },
          { key: "consultant", label: "Consultant", type: "text" },
          ...["MARKETING", "SALES", "TEAM / HR", "OPERATIONS & EXECUTION", "ACCOUNTS & FINANCE", "MANAGEMENT / R&D"]
            .flatMap((fn) => [
              { key: `${fn}_rating`, label: `${fn} - Current Level`, type: "rating", options: RATING4 },
              { key: `${fn}_observations`, label: `${fn} - Key Observations`, type: "textarea" },
              { key: `${fn}_rootcause`, label: `${fn} - Root Cause / Gap`, type: "textarea" },
              { key: `${fn}_action`, label: `${fn} - Recommended Next Step`, type: "textarea" },
            ]),
          { key: "bottleneck", label: "Biggest Bottleneck Identified", type: "textarea" },
          { key: "priority_1", label: "Growth Roadmap Priority 1 (0-90 days)", type: "textarea" },
          { key: "priority_2", label: "Growth Roadmap Priority 2 (3-6 months)", type: "textarea" },
          { key: "priority_3", label: "Growth Roadmap Priority 3 (6-12 months)", type: "textarea" },
          { key: "action_owner_followup", label: "Action Owner & Next Follow-up Date", type: "text" },
        ],
      },
    ],
  },
  {
    group: "System Rollout & Reporting Pack",
    forms: [
      {
        key: "rollout_document_checklist",
        title: "A. 20-Day Role-wise Document Rollout Checklist",
        fields: [
          {
            key: "rows", label: "", type: "table",
            columns: [
              { key: "day", label: "Day" },
              { key: "document", label: "Document / Tool" },
              { key: "given", label: "Given (Y/N)" },
              { key: "date_given", label: "Date Given" },
            ],
          },
        ],
      },
      {
        key: "daily_report",
        title: "B. Daily Report",
        entryPerDate: true,
        fields: [
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Role", type: "text" },
          { key: "date", label: "Date", type: "text" },
          { key: "department", label: "Department", type: "text" },
          { key: "branch", label: "Branch/Location", type: "text" },
          { key: "check_in", label: "Check-in Time", type: "text" },
          { key: "check_out", label: "Check-out Time", type: "text" },
          {
            key: "tasks", label: "Assigned Tasks", type: "table",
            columns: [
              { key: "task", label: "Task" },
              { key: "time", label: "Time" },
              { key: "status", label: "Status (Done/Progress/Skip)" },
              { key: "remarks", label: "Remarks" },
            ],
          },
          { key: "completed", label: "Completed Tasks", type: "text" },
          { key: "not_completed", label: "Not Completed", type: "text" },
          { key: "carried_forward", label: "Carried Forward", type: "text" },
          { key: "completion_rate", label: "Completion Rate %", type: "text" },
          { key: "productive_hours", label: "Productive Hours", type: "text" },
          { key: "self_rating", label: "Self Rating /10", type: "text" },
        ],
      },
      {
        key: "weekly_report_review",
        title: "C. Weekly Report Review",
        entryPerDate: true,
        fields: [
          { key: "week_of", label: "Week Of", type: "text" },
          { key: "reviewed_by", label: "Reviewed By", type: "text" },
          { key: "department", label: "Department/Team", type: "text" },
          {
            key: "snapshot", label: "Team Member Weekly Snapshot", type: "table",
            columns: [
              { key: "member", label: "Team Member" },
              { key: "completed", label: "Tasks Completed" },
              { key: "pending", label: "Tasks Pending" },
              { key: "kpi", label: "KPI Snapshot" },
              { key: "rating", label: "Rating /10" },
              { key: "remarks", label: "Manager Remarks" },
            ],
          },
          { key: "wins", label: "Key Wins This Week", type: "textarea" },
          { key: "issues", label: "Issues / Blockers", type: "textarea" },
          { key: "next_actions", label: "Action Items for Next Week", type: "textarea" },
        ],
      },
      {
        key: "monthly_report",
        title: "D. Monthly Report & Record-Keeping",
        entryPerDate: true,
        fields: [
          { key: "month", label: "Month", type: "text" },
          { key: "reviewed_by", label: "Reviewed By (Owner)", type: "text" },
          {
            key: "dept_rows", label: "Department-wise Target vs Actual", type: "table",
            fixedLabels: ["Marketing", "Sales", "Operations", "HR", "Accounts", "Management", "R&D"],
            columns: [
              { key: "department", label: "Department", readonlyIndex: true },
              { key: "target", label: "Target" },
              { key: "actual", label: "Actual" },
              { key: "variance", label: "Variance" },
              { key: "achievement", label: "Key Achievement" },
              { key: "issue", label: "Issue / Concern" },
            ],
          },
          { key: "revenue", label: "Total Revenue (Rs)", type: "text" },
          { key: "expenses", label: "Total Expenses (Rs)", type: "text" },
          { key: "profit", label: "Net Profit (Rs)", type: "text" },
          { key: "leads", label: "New Leads / Enquiries", type: "text" },
          { key: "closed", label: "Projects Closed", type: "text" },
          { key: "conversion", label: "Conversion Rate %", type: "text" },
          { key: "team_summary", label: "Team Performance Summary", type: "textarea" },
          { key: "issues_resolutions", label: "Issues & Resolutions This Month", type: "textarea" },
          { key: "next_plan", label: "Next Month Plan / Priorities", type: "textarea" },
        ],
      },
    ],
  },
];

export function findForm(key) {
  for (const g of FORM_GROUPS) {
    const f = g.forms.find((f) => f.key === key);
    if (f) return f;
  }
  return null;
}
