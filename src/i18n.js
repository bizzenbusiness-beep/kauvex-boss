// Lightweight i18n — covers the app chrome (nav, header, common buttons).
// Deep per-field translation of every form/module can be added
// incrementally by adding more keys here.

export const LANGUAGES = [
  { key: "en", label: "English", dir: "ltr" },
  { key: "ml", label: "മലയാളം", dir: "ltr" },
  { key: "manglish", label: "Manglish", dir: "ltr" },
  { key: "hi", label: "हिंदी", dir: "ltr" },
  { key: "ar", label: "العربية", dir: "rtl" },
];

const DICT = {
  // Nav
  nav_coord: { en: "Project Coordination", ml: "പ്രോജക്റ്റ് കോർഡിനേഷൻ", manglish: "Project Coordination", hi: "परियोजना समन्वय", ar: "تنسيق المشروع" },
  nav_hr: { en: "HR", ml: "എച്ച്ആർ", manglish: "HR", hi: "मानव संसाधन", ar: "الموارد البشرية" },
  nav_activity: { en: "Activity", ml: "പ്രവർത്തനം", manglish: "Activity", hi: "गतिविधि", ar: "النشاط" },
  nav_measure: { en: "Measure & Monitor", ml: "അളവും നിരീക്ഷണവും", manglish: "Measure & Monitor", hi: "मापें और निगरानी करें", ar: "القياس والمراقبة" },
  nav_improve: { en: "Improvement Calc", ml: "മെച്ചപ്പെടുത്തൽ കാൽക്", manglish: "Improvement Calc", hi: "सुधार गणना", ar: "حاسبة التحسين" },
  nav_forms: { en: "Forms & Trackers", ml: "ഫോമുകളും ട്രാക്കറുകളും", manglish: "Forms & Trackers", hi: "फॉर्म और ट्रैकर", ar: "النماذج والمتتبعات" },
  nav_framex: { en: "BizZen Framex", ml: "ബിസ്‌സെൻ ഫ്രെയിംക്സ്", manglish: "BizZen Framex", hi: "बिज़ेन फ्रेमेक्स", ar: "بيزن فريمكس" },
  nav_registrations: { en: "Registrations", ml: "റജിസ്ട്രേഷൻസ്", manglish: "Registrations", hi: "रजिस्ट्रेशन", ar: "التسجيلات" },
  nav_dashboard: { en: "Dashboard", ml: "ഡാഷ്ബോഡ്", manglish: "Dashboard", hi: "डैशबोर्ड", ar: "لوحة المعلومات" },
  nav_team: { en: "Team", ml: "ടീം", manglish: "Team", hi: "टीम", ar: "الفريق" },
  nav_ourbiz: { en: "Our Business", ml: "ഐ ബിസിനസ്സ്", manglish: "Our Business", hi: "हमारा व्यवसाय", ar: "عملنا" },
  nav_companies: { en: "Companies", ml: "കമ്പനികള്‍", manglish: "Companies", hi: "कंपनियां", ar: "الشركات" },

  // Header / auth
  sign_in: { en: "Sign In", ml: "സൈൻ ഇൻ ചെയ്യുക", manglish: "Sign In cheyyuka", hi: "साइन इन करें", ar: "تسجيل الدخول" },
  sign_out: { en: "Sign out", ml: "സൈൻ ഔട്ട്", manglish: "Sign out", hi: "साइन आउट", ar: "تسجيل الخروج" },
  email: { en: "Email", ml: "ഇമെയിൽ", manglish: "Email", hi: "ईमेल", ar: "البريد الإلكتروني" },
  password: { en: "Password", ml: "പാസ്‌വേഡ്", manglish: "Password", hi: "पासवर्ड", ar: "كلمة المرور" },
  sign_in_workspace: { en: "Sign in to your workspace", ml: "നിങ്ങളുടെ വർക്ക്‌സ്‌പേസിലേക്ക് സൈൻ ഇൻ ചെയ്യുക", manglish: "Ningalude workspace-lekku sign in cheyyuka", hi: "अपने वर्कस्पेस में साइन इन करें", ar: "سجّل الدخول إلى مساحة عملك" },

  // Common actions
  add: { en: "Add", ml: "ചേർക്കുക", manglish: "Add cheyyuka", hi: "जोड़ें", ar: "إضافة" },
  save: { en: "Save", ml: "സേവ് ചെയ്യുക", manglish: "Save cheyyuka", hi: "सहेजें", ar: "حفظ" },
  loading: { en: "Loading...", ml: "ലോഡ് ചെയ്യുന്നു...", manglish: "Load aavunnu...", hi: "लोड हो रहा है...", ar: "جارٍ التحميل..." },
  cancel: { en: "Cancel", ml: "റദ്ദാക്കുക", manglish: "Cancel cheyyuka", hi: "रद्द करें", ar: "إلغاء" },
  no_company: { en: "No company selected yet.", ml: "ഇതുവരെ കമ്പനി തിരഞ്ഞെടുത്തിട്ടില്ല.", manglish: "Company select cheythittilla.", hi: "अभी तक कोई कंपनी चयनित नहीं है।", ar: "لم يتم اختيار شركة بعد." },
  all_branches: { en: "All branches", ml: "എല്ലാ ബ്രാഞ്ചുകളും", manglish: "Ella branches-um", hi: "सभी शाखाएं", ar: "جميع الفروع" },
};

export function t(key, lang = "en") {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
}
