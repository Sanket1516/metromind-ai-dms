export interface DashboardStats {
  totalDocuments: number;
  activeUsers: number;
  processingRate: number;
  storageUsed: number;
}

export interface DailyStat {
  date: string;
  count: number;
}

export interface TypeDistribution {
  type: string;
  count: number;
}

export interface DocumentStats {
  dailyStats: DailyStat[];
  typeDistribution: TypeDistribution[];
}

export interface DepartmentStat {
  department: string;
  documentCount: number;
}

export type TimeRange = '7d' | '30d' | '90d' | 'custom';
