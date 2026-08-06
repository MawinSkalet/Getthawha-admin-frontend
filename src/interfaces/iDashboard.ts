export type DashboardStats = {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  todayBookings: number;
};

export type TrendItem = {
  name: string; // month name
  totalBookings: number;
};

export type BranchPerformanceItem = {
  branchId: string;
  branchName: string;
  totalBookings: string; // API returns string
};

export type ActivityItem = {
  id: string;
  type: "booking" | "register";
  title: string;
  time: Date;
};

export type UseDashboardReturn = {
  statistics: DashboardStats;
  monthlyTrend: TrendItem[];
  branchPerformance: BranchPerformanceItem[];
  activities: ActivityItem[];
  loadingActivities: boolean;
  reload: () => void;
  loadRecentActivityByDate: (
    day: number | string,
    month: number | string,
    year: number | string
  ) => Promise<void> | void;
};
