import {
  DashboardSummary,
  KPIMetric,
  BFSIDeal,
  BFSILead,
  AIInsight,
  ProductPerformance,
  MonthlyTrend,
  TeamMember,
  SalesReport,
  ProductCategory,
  DealStatus,
  LeadStage,
} from './types';

const MOCK_USER = {
  name: "Rajesh Varma",
  email: "rajesh.varma@apexbfsi.in",
  role: "Chief Commercial Officer",
  branch: "Mumbai Central Hub (HQ)",
  avatar: "RV",
};

const MOCK_KPIS: KPIMetric[] = [
  {
    id: "revenue",
    label: "Sales Revenue (MTD)",
    value: "₹4.82 Cr",
    rawValue: 48200000,
    change: "+14.8%",
    isPositive: true,
    timeframe: "vs ₹4.20 Cr last month",
    progressPct: 78,
  },
  {
    id: "policies",
    label: "Policies Closed",
    value: "1,248",
    rawValue: 1248,
    change: "+8.3%",
    isPositive: true,
    timeframe: "Target: 1,150",
    progressPct: 86,
  },
  {
    id: "leads",
    label: "Active Inbound Leads",
    value: "3,842",
    rawValue: 3842,
    change: "+21.4%",
    isPositive: true,
    timeframe: "1,420 high-intent",
    progressPct: 92,
  },
  {
    id: "conversion",
    label: "Underwriting Win Rate",
    value: "32.6%",
    rawValue: 32.6,
    change: "+3.2%",
    isPositive: true,
    timeframe: "Avg cycle: 4.2 days",
    progressPct: 65,
  },
];

const MOCK_MONTHLY_TRENDS: MonthlyTrend[] = [
  { month: "MAR", revenue: 3.4, target: 3.2, policiesSold: 890 },
  { month: "APR", revenue: 3.8, target: 3.5, policiesSold: 980 },
  { month: "MAY", revenue: 4.1, target: 3.9, policiesSold: 1060 },
  { month: "JUN", revenue: 3.9, target: 4.0, policiesSold: 1020 },
  { month: "JUL", revenue: 4.3, target: 4.2, policiesSold: 1140 },
  { month: "AUG", revenue: 4.82, target: 4.5, policiesSold: 1248 },
];

const MOCK_PRODUCTS: ProductPerformance[] = [
  { product: "Life Insurance", revenueCr: 1.68, percentage: 35, growthPct: 18.2, color: "#9aac8b" },
  { product: "Health Insurance", revenueCr: 1.35, percentage: 28, growthPct: 22.4, color: "#7a8a6d" },
  { product: "Corporate Lending", revenueCr: 0.96, percentage: 20, growthPct: 11.5, color: "#b4c3a4" },
  { product: "Wealth Management", revenueCr: 0.58, percentage: 12, growthPct: 34.0, color: "#5a6850" },
  { product: "Motor & General", revenueCr: 0.25, percentage: 5, growthPct: -4.1, color: "#3a4434" },
];

const MOCK_DEALS: BFSIDeal[] = [
  {
    id: "d1",
    dealNumber: "DL-2026-8941",
    clientName: "Tata Consultancy Services (Group Health)",
    product: "Health Insurance",
    policyType: "Comprehensive Corporate Group Shield",
    premiumValue: "₹48.5 L",
    rawPremium: 4850000,
    status: "Negotiation",
    leadScore: 94,
    closingProbability: 88,
    assignedOfficer: { name: "Priya Sharma", avatar: "PS", role: "Senior Corporate RM" },
    date: "Today, 02:40 PM",
    region: "West (Mumbai)",
  },
  {
    id: "d2",
    dealNumber: "DL-2026-8940",
    clientName: "Infosys Employee Trust",
    product: "Wealth Management",
    policyType: "Executive Superannuation Fund",
    premiumValue: "₹72.0 L",
    rawPremium: 7200000,
    status: "Closed Won",
    leadScore: 98,
    closingProbability: 100,
    assignedOfficer: { name: "Vikram Malhotra", avatar: "VM", role: "Director - Institutional Sales" },
    date: "Today, 11:15 AM",
    region: "South (Bengaluru)",
  },
  {
    id: "d3",
    dealNumber: "DL-2026-8939",
    clientName: "Dr. Ananya Sengupta & Associates",
    product: "Life Insurance",
    policyType: "Keyman Term Shield + Critical Illness",
    premiumValue: "₹18.2 L",
    rawPremium: 1820000,
    status: "Underwriting",
    leadScore: 86,
    closingProbability: 75,
    assignedOfficer: { name: "Rohan Kulkarni", avatar: "RK", role: "HNI Wealth Consultant" },
    date: "Yesterday",
    region: "West (Mumbai)",
  },
  {
    id: "d4",
    dealNumber: "DL-2026-8938",
    clientName: "Zenith Automotive Logistics Pvt Ltd",
    product: "Corporate Lending",
    policyType: "Commercial Fleet Equipment Financing",
    premiumValue: "₹1.20 Cr",
    rawPremium: 12000000,
    status: "KYC Pending",
    leadScore: 79,
    closingProbability: 62,
    assignedOfficer: { name: "Anil Deshmukh", avatar: "AD", role: "VP Commercial Banking" },
    date: "14 Aug 2026",
    region: "North (Delhi NCR)",
  },
  {
    id: "d5",
    dealNumber: "DL-2026-8937",
    clientName: "Sun Pharmaceuticals R&D Leadership",
    product: "Life Insurance",
    policyType: "Guaranteed Return HNI Endowment",
    premiumValue: "₹35.0 L",
    rawPremium: 3500000,
    status: "Closed Won",
    leadScore: 96,
    closingProbability: 100,
    assignedOfficer: { name: "Priya Sharma", avatar: "PS", role: "Senior Corporate RM" },
    date: "13 Aug 2026",
    region: "West (Mumbai)",
  },
  {
    id: "d6",
    dealNumber: "DL-2026-8936",
    clientName: "Kalyan Jewellers Staff Welfare Trust",
    product: "Health Insurance",
    policyType: "Group Top-up Mediclaim",
    premiumValue: "₹24.5 L",
    rawPremium: 2450000,
    status: "Proposal",
    leadScore: 82,
    closingProbability: 55,
    assignedOfficer: { name: "Rohan Kulkarni", avatar: "RK", role: "HNI Wealth Consultant" },
    date: "12 Aug 2026",
    region: "South (Chennai)",
  },
];

const MOCK_AI_INSIGHTS: AIInsight[] = [
  {
    id: "ins_1",
    title: "Cross-Sell Trigger: 142 Term Insurance Holders",
    description: "Machine learning cross-sell engine identified 142 HNI clients who purchased Term Plans (>₹50L) 12 months ago and now match Mutual Fund PMS criteria.",
    impactScore: "+₹85 L Premium",
    category: "Cross-Sell Opportunity",
    priority: "Urgent",
    suggestedAction: "Launch Targeted Wealth Allocation Pitch via WhatsApp & RM Call",
    confidence: 94,
    targetCount: 142,
  },
  {
    id: "ins_2",
    title: "Renewal Risk: 89 Motor Fleet Accounts Expiring in 15 Days",
    description: "Competitor discounting in North corridor. Instant 4.5% loyalty retention rebate suggested to secure ₹42L fleet renewals.",
    impactScore: "₹42 L at Risk",
    category: "Retention Risk",
    priority: "High",
    suggestedAction: "Auto-approve 4.5% Loyalty Discount & Notify Commercial RMs",
    confidence: 88,
    targetCount: 89,
  },
  {
    id: "ins_3",
    title: "Fast-Track Auto-Underwriting: 230 Straight-Through Leads",
    description: "Digital verification scored 230 retail health applicants with 0% risk flags across CIBIL and medical history. Can be closed in <2 hours.",
    impactScore: "3.2x Velocity",
    category: "Straight-Through Processing",
    priority: "Medium",
    suggestedAction: "Trigger Instant Digital Policy Issuance via Digilocker Integration",
    confidence: 97,
    targetCount: 230,
  },
];

const MOCK_LEADS: BFSILead[] = [
  {
    id: "l1", leadId: "LD-8901",
    customerName: "Rameshwar Goenka",
    contactEmail: "r.goenka@goenkasteel.in",
    phoneNumber: "+91 98201 44892",
    category: "Wealth Management",
    intent: "High", leadScore: 96,
    aiRiskFactor: "Low Risk", estimatedValue: "₹45.0 L",
    source: "Web Inbound", stage: "Proposal Sent",
    lastInteraction: "12 mins ago", assignedTo: "Vikram Malhotra",
    recommendedProduct: "HNI Dynamic Equity Portfolio",
  },
  {
    id: "l2", leadId: "LD-8902",
    customerName: "Meenakshi Sundaram",
    contactEmail: "m.sundaram@chennaitech.org",
    phoneNumber: "+91 94440 12890",
    category: "Health Insurance",
    intent: "High", leadScore: 92,
    aiRiskFactor: "Low Risk", estimatedValue: "₹18.5 L",
    source: "Partner Channel", stage: "Underwriting",
    lastInteraction: "45 mins ago", assignedTo: "Priya Sharma",
    recommendedProduct: "Family Super Top-Up + Maternity Shield",
  },
  {
    id: "l3", leadId: "LD-8903",
    customerName: "Sanjay Singhania",
    contactEmail: "sanjay@singhanialogistics.com",
    phoneNumber: "+91 98110 55431",
    category: "Corporate Lending",
    intent: "Medium", leadScore: 78,
    aiRiskFactor: "Moderate", estimatedValue: "₹1.10 Cr",
    source: "Branch Walk-in", stage: "Qualified",
    lastInteraction: "2 hours ago", assignedTo: "Anil Deshmukh",
    recommendedProduct: "SME Working Capital Term Loan",
  },
  {
    id: "l4", leadId: "LD-8904",
    customerName: "Dr. Kavita Nair",
    contactEmail: "dr.kavita@apollohospitals.org",
    phoneNumber: "+91 98450 77123",
    category: "Life Insurance",
    intent: "High", leadScore: 95,
    aiRiskFactor: "Low Risk", estimatedValue: "₹25.0 L",
    source: "Telecalling AI", stage: "Proposal Sent",
    lastInteraction: "3 hours ago", assignedTo: "Rohan Kulkarni",
    recommendedProduct: "Doctor Special Indemnity + Term Plan",
  },
];

const MOCK_TEAM: TeamMember[] = [
  { id: "tm1", name: "Vikram Malhotra", role: "Director - Institutional Sales", avatar: "VM", branch: "Mumbai Central", targetAchievedPct: 142, revenueClosedCr: 1.82, activeLeads: 28, conversionRate: 41.2, status: "Top Performer" },
  { id: "tm2", name: "Priya Sharma", role: "Senior Corporate RM", avatar: "PS", branch: "Mumbai Central", targetAchievedPct: 118, revenueClosedCr: 1.24, activeLeads: 36, conversionRate: 36.8, status: "Top Performer" },
  { id: "tm3", name: "Anil Deshmukh", role: "VP Commercial Banking", avatar: "AD", branch: "Delhi NCR", targetAchievedPct: 96, revenueClosedCr: 0.94, activeLeads: 22, conversionRate: 28.5, status: "On Track" },
  { id: "tm4", name: "Rohan Kulkarni", role: "HNI Wealth Consultant", avatar: "RK", branch: "Bengaluru Hub", targetAchievedPct: 92, revenueClosedCr: 0.58, activeLeads: 41, conversionRate: 29.0, status: "On Track" },
];

const MOCK_REPORTS: SalesReport[] = [
  { id: "r1", title: "IRDAI Compliance & Anti-Money Laundering (AML) Audit", period: "Q2 FY2026-27", generatedDate: "15 Aug 2026", category: "Regulatory Compliance", fileSize: "4.8 MB", format: "PDF" },
  { id: "r2", title: "Monthly Sales Velocity & Conversion Funnel Analysis", period: "July 2026", generatedDate: "01 Aug 2026", category: "Revenue Audit", fileSize: "2.1 MB", format: "XLSX" },
  { id: "r3", title: "AI Underwriting Risk & Claim Settlement Ratio Forecast", period: "H1 FY2026", generatedDate: "10 Aug 2026", category: "Underwriting Efficiency", fileSize: "6.3 MB", format: "PDF" },
];

/* ── Public Accessors ─────────────────────────────────────────────────────── */

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return {
    user: MOCK_USER,
    metrics: MOCK_KPIS,
    monthlyTrends: MOCK_MONTHLY_TRENDS,
    productDistribution: MOCK_PRODUCTS,
    recentDeals: MOCK_DEALS,
    topAIInsights: MOCK_AI_INSIGHTS,
    quickStats: {
      kycPendingApproval: 34,
      underwritingQueue: 18,
      highIntentLeadsToday: 142,
      targetPacingPct: 108.4,
    },
  };
}

export async function getDeals(category?: ProductCategory, status?: DealStatus): Promise<BFSIDeal[]> {
  let deals = [...MOCK_DEALS];
  if (category) deals = deals.filter((d) => d.product === category);
  if (status) deals = deals.filter((d) => d.status === status);
  return deals;
}

export async function getLeads(stage?: LeadStage, query?: string): Promise<BFSILead[]> {
  let leads = [...MOCK_LEADS];
  if (stage) leads = leads.filter((l) => l.stage === stage);
  if (query) {
    const q = query.toLowerCase();
    leads = leads.filter((l) => l.customerName.toLowerCase().includes(q) || l.leadId.toLowerCase().includes(q));
  }
  return leads;
}

export async function getTeam(): Promise<TeamMember[]> {
  return MOCK_TEAM;
}

export async function getReports(): Promise<SalesReport[]> {
  return MOCK_REPORTS;
}

export async function getProductPerformance(): Promise<ProductPerformance[]> {
  return MOCK_PRODUCTS;
}
