/** Bilingual marketing copy for the public landing page (en / ar). */

const landingEn = {
  navItems: [
    { href: "#intro", label: "Intro" },
    { href: "#participant-features", label: "Participants" },
    { href: "#organizer-features", label: "Organizers" },
    { href: "#faq", label: "Q&A" },
    { href: "#contact", label: "Contact" },
  ],
  /** Logo marquee heading */
  logoMarqueeHeading: "Used by employees working at",
  participantSectionTitle: "Participant features",
  participantSectionSubtitle: "Built for people who join programs—not just browse posters.",
  organizerSectionTitle: "Organizer features",
  organizerSectionSubtitle: "Everything linked from your provider command center, in one visual language.",
  faqTitle: "Questions & answers",
  faqSubtitle: "Quick overview for visitors. Final legal and product copy may differ in production.",
  participantFeatures: [
    {
      title: "Programs catalog",
      description:
        "One place to explore hackathons, bootcamps, workshops, webinars, and conferences. Save what you like and return when applications open—no more hunting through scattered sites.",
    },
    {
      title: "Registration",
      description:
        "Apply through a clear, guided flow, join waitlists when programs are full, and receive confirmations in the app. Your status stays visible so you are not guessing from old email threads.",
    },
    {
      title: "Attendance",
      description:
        "Check in with QR codes or location-based flows when organizers turn them on. If something fails, you see simple next steps instead of being stuck at the door.",
    },
    {
      title: "Credentials",
      description:
        "When organizers publish certificates, download your PDF immediately and keep a single timeline of what you completed—handy for employers, schools, or your own records.",
    },
    {
      title: "Notifications",
      description:
        "Get timely alerts when schedules move, your waitlist position changes, or a session is about to start, so you are never guessing where you need to be.",
    },
  ],
  organizerFeatures: [
    {
      title: "Command center",
      description:
        "Publish hackathons, bootcamps, workshops, events, and webinars from one home. Each format opens the right tools so your team is not jumping between disconnected admin panels.",
    },
    {
      title: "Live operations",
      description:
        "Watch attendance, waitlists, and check-ins as they happen. Lock a session when it should be closed, then export who actually attended for ops or compliance.",
    },
    {
      title: "Review workflow",
      description:
        "Score applicants and submissions with structured rubrics so reviewers align on criteria. Less spreadsheet work, more time on who actually fits the program.",
    },
    {
      title: "Certificates",
      description:
        "Upload a template, map participant fields once, and generate individualized PDFs in bulk. Hand finance or partners a clean CSV when they need proof of completion.",
    },
    {
      title: "Wrap-up",
      description:
        "Close programs with summaries, participant messaging, and cohort-style views so you can debrief sponsors and plan the next run without reconstructing everything by hand.",
    },
  ],
  faqItems: [
    {
      q: "What is Ramsha?",
      a: "Ramsha is an event and learning platform for organizers who run hackathons, bootcamps, workshops, conferences, and webinars—and for participants who want one place to discover, register, attend, and prove completion. (Marketing overview; final product details may vary.)",
    },
    {
      q: "Who is it for?",
      a: "Organizers use the Provider Command Center to publish programs, manage applicants, run live attendance, and issue certificates. Participants use the app to browse opportunities, register, check in, and track activity.",
    },
    {
      q: "Is there a public pricing page?",
      a: "Pricing is not shown on this demo landing. Contact us below for pilots, education plans, or enterprise deployment. Placeholder copy only.",
    },
    {
      q: "How do check-ins work?",
      a: "Organizers can enable QR scanning or GPS-based check-in for supported flows. Participants see clear steps in the app; organizers see live counts in their monitors.",
    },
    {
      q: "Where is my data stored?",
      a: "This repository is a front-end experience. A production deployment would pair with your chosen backend and region. For privacy questions, use the contact section—placeholder until a formal policy is linked.",
    },
    {
      q: "How do I get started?",
      a: "Create an account via Sign up, complete onboarding if prompted, then explore as a participant or switch to organizer tools if your account has that role.",
    },
  ],
  introParticipant: {
    eyebrow: "For Participants",
    h1Part1: "Discover events, ",
    h1Accent1: "register instantly",
    h1Mid: ", ",
    h1Accent2: "check in",
    h1Mid2: ", and earn ",
    h1Accent3: "your credentials",
    h1End: ".",
    paragraph:
      "Browse hackathons, bootcamps, workshops, webinars, and conferences in one place. Register in minutes, check in with QR or GPS, and collect certificates that prove your participation.",
    statLabels: [
      "Sessions & RSVPs tracked (demo)",
      "Years combined team exp. (demo)",
      "Design target: clear journeys",
    ],
    chartTitle: "Participant activity mix (demo)",
    chartSubtitle: "Illustrative distribution across event formats in participant flow",
    chartFooter: "Participation trending up this quarter (placeholder)",
    chartFooterDetail: "Illustrative participant journey from discover to credential completion.",
    chartCenterCaption: "Demo RSVPs",
    chartTypes: {
      workshops: "Workshops",
      webinars: "Webinars",
      hackathons: "Hackathons",
      bootcamps: "Bootcamps",
    },
  },
  introOrganizer: {
    eyebrow: "For Organizers",
    h1Part1: "Launch programs, ",
    h1Accent1: "manage attendance",
    h1Mid: ", ",
    h1Accent2: "issue certificates",
    h1Mid2: ", and get ",
    h1Accent3: "real-time analytics",
    h1End: ".",
    paragraph:
      "Run hackathons, bootcamps, workshops, and webinars from one command center. Monitor capacity, automate check-ins, score applicants with AI, and generate certificates at scale.",
    statLabels: [
      "Sessions & RSVPs tracked (demo)",
      "Years combined team exp. (demo)",
      "Design target: clear journeys",
    ],
    chartTitle: "Organizer operations mix (demo)",
    chartSubtitle: "Illustrative distribution across organizer workflows",
    chartFooter: "Operations trending up this quarter (placeholder)",
    chartFooterDetail: "Illustrative mix across sessions, attendance, review, and completion workflows.",
    chartCenterCaption: "Demo RSVPs",
    chartTypes: {
      workshops: "Workshops",
      webinars: "Webinars",
      hackathons: "Hackathons",
      bootcamps: "Bootcamps",
    },
  },
  contact: {
    badge: "Contact",
    title: "Get in touch",
    blurb:
      "Whether you are piloting Ramsha at a school, a company, or a community—we are happy to hear from you. Details below are placeholders for a future live deployment.",
    cards: [
      { key: "email", label: "Email", value: "hello@ramsha.example" },
      { key: "phone", label: "Phone", value: "+1 (555) 010-2030" },
      { key: "address", label: "Address", value: "Remote-first · Demo HQ placeholder" },
      { key: "hours", label: "Hours", value: "Support hours: 9:00 – 18:00 (placeholder)" },
    ],
    footerPrivacy: "Privacy policy",
    footerTerms: "Terms of use",
    footerCookies: "Cookie policy",
    followUs: "Follow us",
  },
};

const landingAr = {
  navItems: [
    { href: "#intro", label: "المقدمة" },
    { href: "#participant-features", label: "المشاركون" },
    { href: "#organizer-features", label: "المنظمون" },
    { href: "#faq", label: "الأسئلة" },
    { href: "#contact", label: "تواصل" },
  ],
  logoMarqueeHeading: "يستخدمه موظفون يعملون في",
  participantSectionTitle: "ميزات المشارك",
  participantSectionSubtitle: "لمن ينضم إلى البرامج فعلياً—لا لمن يكتفي بقراءة الإعلانات.",
  organizerSectionTitle: "ميزات المنظم",
  organizerSectionSubtitle: "كل شيء يبدأ من مركز المورّد، بلغة بصرية واحدة.",
  faqTitle: "أسئلة وأجوبة",
  faqSubtitle: "نظرة سريعة للزوار. قد يختلف النص القانوني والمنتج في الإصدار النهائي.",
  participantFeatures: [
    {
      title: "كتالوج البرامج",
      description:
        "مكان واحد لاستكشاف الهاكاثونات والمعسكرات وورش العمل والندوات والمؤتمرات. احفظ ما يهمك وعد عند فتح التسجيل—دون تتبع مواقع متفرقة.",
    },
    {
      title: "التسجيل",
      description:
        "قدّم عبر مسار واضح، انضم لقوائم الانتظار عند الامتلاء، وتلقَّ تأكيدات داخل التطبيق. حالتك تبقى ظاهرة فلا تعتمد على سلاسل بريد قديمة.",
    },
    {
      title: "الحضور",
      description:
        "سجّل حضورك برمز الاستجابة السريعة أو التحقق بالموقع عند تفعيل المنظم لذلك. إن حدث خطأ، ترى خطوات بسيطة بدل الوقوف دون حل.",
    },
    {
      title: "الاعتمادات",
      description:
        "عند نشر المنظمين للشهادات، حمّل ملف PDF فوراً واحتفظ بخط زمني واحد لما أنجزته—مفيد لأصحاب العمل أو المدارس أو أرشيفك الشخصي.",
    },
    {
      title: "التنبيهات",
      description:
        "تنبيهات في الوقت المناسب عند تغيّر الجدول أو تحرك قائمة الانتظار أو اقتراب جلسة، حتى لا تضيع مكانك أو وقتك.",
    },
  ],
  organizerFeatures: [
    {
      title: "مركز القيادة",
      description:
        "أطلق الهاكاثونات والمعسكرات وورش العمل والفعاليات والندوات من صفحة رئيسية واحدة. كل نوع يفتح الأدوات المناسبة دون لوحات إدارة متفرقة.",
    },
    {
      title: "العمليات المباشرة",
      description:
        "راقب الحضور وقوائم الانتظار والتحقق لحظياً. أغلق الجلسة عند الحاجة ثم صدّر من حضر فعلياً للتشغيل أو الامتثال.",
    },
    {
      title: "مسار المراجعة",
      description:
        "قيّم المتقدمين والمشاركات بمعايير موحدة حتى يتفق المراجعون على المعايير. أقل عمل في الجداول، ووقت أكثر لمن يناسب البرنامج فعلاً.",
    },
    {
      title: "الشهادات",
      description:
        "ارفع قالباً، اربط حقول المشاركين مرة واحدة، وأنشئ ملفات PDF مفردة على نطاق واسع. سلّم CSV نظيفاً للمالية أو الشركاء عند طلب إثبات الإكمال.",
    },
    {
      title: "الختام",
      description:
        "أنهِ البرامج بملخصات ورسائل للمشاركين وعروض على شكل مجموعات حتى تقدّم للرعاة ما حدث وتخطط للجولة القادمة دون إعادة بناء كل شيء يدوياً.",
    },
  ],
  faqItems: [
    {
      q: "ما هي رمشة؟",
      a: "منصة فعاليات وتعلّم للمنظمين الذين يديرون الهاكاثونات والمعسكرات وورش العمل والمؤتمرات والندوات، وللمشاركين الذين يريدون مكاناً واحداً للاكتشاف والتسجيل والحضور وإثبات الإكمال. (نظرة تسويقية؛ قد يختلف المنتج النهائي.)",
    },
    {
      q: "لمن المنصة؟",
      a: "يستخدم المنظمون مركز قيادة المورّد لنشر البرامج وإدارة المتقدمين وتشغيل الحضور المباشر وإصدار الشهادات. يستخدم المشاركون التطبيق لتصفّح الفرص والتسجيل والتحقق وتتبع النشاط.",
    },
    {
      q: "هل توجد صفحة أسعار عامة؟",
      a: "لا تظهر الأسعار في هذه النسخة التجريبية. تواصل معنا أدناه للتجارب التجريبية أو خطط التعليم أو النشر المؤسسي. نص تجريبي فقط.",
    },
    {
      q: "كيف يعمل تسجيل الحضور؟",
      a: "يمكن للمنظمين تفعيل مسح QR أو التحقق بالموقع للمسارات المدعومة. يرى المشاركون خطوات واضحة في التطبيق؛ يرى المنظمون الأعداد المباشرة في شاشاتهم.",
    },
    {
      q: "أين تُخزَّن بياناتي؟",
      a: "هذا المستودع تجربة واجهة أمامية. النشر الإنتاجي يرتبط بالخادم والمنطقة التي تختارها. لأسئلة الخصوصية استخدم قسم التواصل—نص تجريبي حتى تُربط سياسة رسمية.",
    },
    {
      q: "كيف أبدأ؟",
      a: "أنشئ حساباً عبر التسجيل، أكمل الإعداد عند الطلب، ثم استكشف كمشارك أو انتقل لأدوات المنظم إن كان لحسابك ذلك الدور.",
    },
  ],
  introParticipant: {
    eyebrow: "للمشاركين",
    h1Part1: "اكتشف الفعاليات، ",
    h1Accent1: "سجل بسرعة",
    h1Mid: "، ",
    h1Accent2: "أثبت حضورك",
    h1Mid2: "، واحصل على ",
    h1Accent3: "شهاداتك",
    h1End: ".",
    paragraph:
      "تصفّح الهاكاثونات والمعسكرات وورش العمل والندوات والمؤتمرات في مكان واحد. سجل خلال دقائق، أثبت حضورك برمز QR أو GPS، واحصل على شهادات تثبت مشاركتك.",
    statLabels: [
      "جلسات وحجوزات (تجريبي)",
      "سنوات خبرة الفريق مجمّعة (تجريبي)",
      "هدف التصميم: رحلات واضحة",
    ],
    chartTitle: "مزيج نشاط المشارك (تجريبي)",
    chartSubtitle: "توزيع توضيحي عبر أنواع الفعاليات في رحلة المشارك",
    chartFooter: "نشاط المشاركة في ارتفاع هذا الربع (نص تجريبي)",
    chartFooterDetail: "رحلة توضيحية من الاكتشاف حتى اكتمال الشهادة.",
    chartCenterCaption: "حجوزات تجريبية",
    chartTypes: {
      workshops: "ورش العمل",
      webinars: "الندوات",
      hackathons: "الهاكاثونات",
      bootcamps: "المعسكرات",
    },
  },
  introOrganizer: {
    eyebrow: "للمنظمين",
    h1Part1: "أطلق البرامج، ",
    h1Accent1: "أدر الحضور",
    h1Mid: "، ",
    h1Accent2: "أصدر الشهادات",
    h1Mid2: "، واحصل على ",
    h1Accent3: "تحليلات لحظية",
    h1End: ".",
    paragraph:
      "أدر الهاكاثونات والمعسكرات وورش العمل والندوات من مركز قيادة واحد. راقب السعة، أتمت التحقق من الحضور، قيّم المتقدمين بمساعدة الذكاء الاصطناعي، وأنشئ شهادات على نطاق واسع.",
    statLabels: [
      "جلسات وحجوزات (تجريبي)",
      "سنوات خبرة الفريق مجمّعة (تجريبي)",
      "هدف التصميم: رحلات واضحة",
    ],
    chartTitle: "مزيج عمليات المنظم (تجريبي)",
    chartSubtitle: "توزيع توضيحي عبر سير عمل المنظم",
    chartFooter: "العمليات في ارتفاع هذا الربع (نص تجريبي)",
    chartFooterDetail: "مزيج توضيحي بين إنشاء الجلسات والحضور والمراجعة والاختتام.",
    chartCenterCaption: "حجوزات تجريبية",
    chartTypes: {
      workshops: "ورش العمل",
      webinars: "الندوات",
      hackathons: "الهاكاثونات",
      bootcamps: "المعسكرات",
    },
  },
  contact: {
    badge: "تواصل",
    title: "تواصل معنا",
    blurb:
      "سواء جرّبت رمشة في مدرسة أو شركة أو مجتمع—يسعدنا سماعك. التفاصيل أدناه تجريبية لنشر مستقبلي.",
    cards: [
      { key: "email", label: "البريد", value: "hello@ramsha.example" },
      { key: "phone", label: "الهاتف", value: "+1 (555) 010-2030" },
      { key: "address", label: "العنوان", value: "عن بُعد · مقر تجريبي" },
      { key: "hours", label: "الساعات", value: "دعم: 9:00 – 18:00 (تجريبي)" },
    ],
    footerPrivacy: "سياسة الخصوصية",
    footerTerms: "شروط الاستخدام",
    footerCookies: "ملفات تعريف الارتباط",
    followUs: "تابعنا",
  },
};

/** @param {"en" | "ar"} lang */
export function getLandingCopy(lang) {
  return lang === "ar" ? landingAr : landingEn;
}
