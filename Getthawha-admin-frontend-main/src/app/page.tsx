"use client";
import React from "react";
import AdminNavbar from "@/components/AdminNavBar";
import AdminDashboardPage from "@/components/AdminDashboardPage";

const AdminPage = () => {
  return (
    <>
      <AdminNavbar />
      <div className="w-full min-h-screen p-6">
        <AdminDashboardPage />
      </div>
    </>
  );
};

export default AdminPage;
