export type ProductCategory = 
  | 'Life Insurance'
  | 'Health Insurance'
  | 'Motor & General'
  | 'Corporate Lending'
  | 'Wealth Management';

export type DealStatus = 
  | 'Proposal'
  | 'KYC Pending'
  | 'Underwriting'
  | 'Negotiation'
  | 'Closed Won'
  | 'Lost';

export type LeadIntent = 'High' | 'Medium' | 'Low';
export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Underwriting' | 'Proposal Sent' | 'Converted';

export interface KPIMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  change: string;
  isPositive: boolean;
  timeframe: string;
  progressPct: number;
}

export interface BFSIDeal {
  id: string;
  dealNumber: string;
  clientName: string;
  product: ProductCategory;
  policyType: string;
  premiumValue: string;
  rawPremium: number;
  status: DealStatus;
  leadScore: number;
  assignedOfficer: {
    name: string;
    avatar: string;
    role: string;
  };
  closingProbability: number;
  date: string;
  region: string;
}

export interface BFSILead {
  id: string;
  leadId: string;
  customerName: string;
  contactEmail: string;
  phoneNumber: string;
  category: ProductCategory;
  intent: LeadIntent;
  leadScore: number;
  aiRiskFactor: string;
  estimatedValue: string;
  source: string;
  stage: LeadStage;
  lastInteraction: string;
  assignedTo: string;
  recommendedProduct: string;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  impactScore: string;
  category: string;
  priority: string;
  suggestedAction: string;
  confidence: number;
  targetCount: number;
}

export interface ProductPerformance {
  product: ProductCategory;
  revenueCr: number;
  percentage: number;
  growthPct: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  target: number;
  policiesSold: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  branch: string;
  targetAchievedPct: number;
  revenueClosedCr: number;
  activeLeads: number;
  conversionRate: number;
  status: string;
}

export interface SalesReport {
  id: string;
  title: string;
  period: string;
  generatedDate: string;
  category: string;
  fileSize: string;
  format: string;
}

export interface DashboardSummary {
  user: {
    name: string;
    email: string;
    role: string;
    branch: string;
    avatar: string;
  };
  metrics: KPIMetric[];
  monthlyTrends: MonthlyTrend[];
  productDistribution: ProductPerformance[];
  recentDeals: BFSIDeal[];
  topAIInsights: AIInsight[];
  quickStats: {
    kycPendingApproval: number;
    underwritingQueue: number;
    highIntentLeadsToday: number;
    targetPacingPct: number;
  };
}
