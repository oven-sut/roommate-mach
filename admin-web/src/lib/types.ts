export type Admin = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
};

export type Verification = {
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
} | null;

export type AdminUser = {
  id: string;
  displayName: string;
  email: string;
  sutId: string | null;
  suspended: boolean;
  verification: Verification;
  profile: { major: string | null; year: number | null } | null;
};

export type PagedUsers = { items: AdminUser[]; total: number; page: number; pageSize: number };

export type DashboardStats = {
  members: number;
  active: number;
  matches: number;
  messages: number;
  reports: number;
  unmatched: number;
  pendingVerifications: number;
  swipes: number;
  conversations: number;
};

export type AnalyticsData = {
  yearDistribution: { year: number; count: number }[];
  facultyDistribution: { major: string; count: number }[];
  swipeFunnel: { swiped: number; matched: number; talking: number };
  lifestyleWeights: { sleep: number; cleanliness: number; guests: number; temperature: number };
  reportsByReason: { reason: string; count: number }[];
};

export type Report = {
  id: string;
  reporterId: string;
  reportedId: string;
  reporter: { id: string; displayName: string } | null;
  reported: { id: string; displayName: string; email: string } | null;
  reason: string;
  details: string | null;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
};

export type PagedReports = { items: Report[]; total: number; page: number; pageSize: number };

export type ReportSummary = {
  total: number;
  pending: number;
  byReason: { reason: string; count: number }[];
};
