import type IBranch from "./IBranch";

export type ReportView = "day" | "week" | "month" | "year";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type ReportBooking = {
  id: string;
  date: string;
  status: BookingStatus;
  totalPrice: number;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceTitle: string;
  duration: number | null;
  numberOfGuests: number;
  source: string;
};
export type ReportBucket = {
  key?: string;
  start?: string;
  end?: string;
  label: string;
  fullLabel: string;
  bookings: number;
  revenue: number;
  nextView?: ReportView;
  nextDate?: string;
};
export default interface IBranchReport {
  branch: Pick<IBranch, "id" | "name" | "address" | "phone" | "pictureUrl"> & { isActive: boolean; deletedAt: string | null };
  branches: Pick<IBranch, "id" | "name">[];
  period: { view: ReportView; date: string; start: string; end: string; timezone: string };
  statistics: { bookings: number; revenue: number; customers: number; pending: number };
  statusCounts: Record<BookingStatus, number>;
  chart: ReportBucket[];
  services: { id: string; title: string; duration: number | null; bookings: number; revenue: number }[];
  appointments: { rows: ReportBooking[]; total: number; page: number; pageSize: number; pages: number };
}

export type PerformanceReport = Pick<IBranchReport, "period" | "statistics" | "chart">;
