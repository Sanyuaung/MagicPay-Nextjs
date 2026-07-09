export const DASHBOARD_GREETING_MESSAGES = {
  MORNING: [
    "Start the day with clear priorities, disciplined service, and trusted banking operations.",
    "Begin with strong controls, timely decisions, and customer-first financial service.",
    "Set the tone for accurate execution, secure cash handling, and reliable branch support.",
    "Focus today on service excellence, operational readiness, and responsible banking delivery.",
    "Drive the morning agenda with confidence, compliance, and measurable customer value.",
  ],
  AFTERNOON: [
    "Keep customer commitments moving with accurate decisions and strong operational control.",
    "Sustain service momentum through careful review, timely coordination, and secure execution.",
    "Maintain banking discipline while balancing customer needs, risk awareness, and delivery speed.",
    "Use the afternoon to resolve pending actions and protect every customer service promise.",
    "Strengthen today's results with precise follow-up, clear ownership, and trusted service.",
  ],
  EVENING: [
    "Review today's progress, close key actions, and prepare a confident service handover.",
    "Complete the day with clear reconciliation, accountable follow-up, and strong service quality.",
    "Convert today's activity into reliable outcomes through review, control, and preparation.",
    "Close priority tasks with care and preserve the trust expected in every banking interaction.",
    "Prepare for tomorrow by confirming open items, route updates, and service commitments.",
  ],
  NIGHT: [
    "Monitor critical activity with care and maintain the reliability expected in banking service.",
    "Keep overnight operations steady with alert monitoring, secure handling, and clear escalation.",
    "Support continuous service with controlled decisions and dependable operational awareness.",
    "Protect service continuity through careful tracking, risk awareness, and prompt response.",
    "Maintain confidence after hours with disciplined oversight and trusted banking support.",
  ],
} as const;

export const DASHBOARD_GREETING_STYLES = {
  MORNING: {
    title: "Good Morning",
    color: "#f59e0b",
    background: "linear-gradient(135deg, #fff7ed 0%, #eff6ff 100%)",
  },
  AFTERNOON: {
    title: "Good Afternoon",
    color: "#3b82f6",
    background: "linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%)",
  },
  EVENING: {
    title: "Good Evening",
    color: "#f97316",
    background: "linear-gradient(135deg, #fff7ed 0%, #faf5ff 100%)",
  },
  NIGHT: {
    title: "Good Night",
    color: "#6366f1",
    background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)",
  },
} as const;
