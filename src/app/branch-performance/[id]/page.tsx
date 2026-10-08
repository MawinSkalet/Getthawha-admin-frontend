import { Suspense } from "react";
import AdminNavbar from "@/components/AdminNavBar";
import BranchReportPage from "@/components/BranchReportPage";

export default async function BranchPerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><AdminNavbar /><Suspense fallback={<p className="p-8" role="status">Loading branch report…</p>}><BranchReportPage branchId={id} /></Suspense></>;
}
