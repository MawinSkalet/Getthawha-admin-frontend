"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/hooks/useAuth";
import type { RootState } from "@stores/store";
import { setEmail, setId, setUsername } from "@stores/userSlice";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { username } = useSelector((state: RootState) => state.user);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const displayName = username || "Admin User";
  const avatarUrl =
    "https://img.daisyui.com/images/profile/demo/idiotsandwich@192.webp";

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setLogoutError(null);
    setIsLoggingOut(true);

    try {
      const result = await logout();
      if ("status" in result && result.status === "error") {
        setLogoutError(result.message || "Failed to log out");
        return;
      }

      dispatch(setId(""));
      dispatch(setEmail(""));
      dispatch(setUsername(""));

      router.replace("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      setLogoutError("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Function to get page title based on pathname
  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Admin Dashboard";
      case "/bookingCalendar":
        return "Booking Calendar";
      case "/userList":
        return "User Management";
      case "/manualBooking":
        return "Manual Booking";
      case "/branchManagement":
        return "Branch Management";
      case "/packageManagement":
        return "Package Management";
      case "/staffManagement":
        return "Staff Management";
      case "/voucherManagement":
        return "Voucher Management";
      case "/reviewManagement":
        return "Review Management";
      default:
        // Handle dynamic routes like /userList/[id]
        if (pathname.startsWith("/userList/")) {
          return "User Details";
        }
        return "Admin Dashboard";
    }
  };

  return (
    <>
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
        <div className="flex-1">
          <div className="dropdown">
            <div
              tabIndex={0}
              className="btn btn-ghost text-lg roboto-600"
              role="button"
            >
              {getPageTitle()}
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
            >
              <li>
                <Link href="/">
                  <div
                    className={`flex flex-row gap-2 ${
                      pathname === "/" && "text-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                      />
                    </svg>

                    <span>Admin Dashboard</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/reviewManagement">
                  <div
                    className={`flex flex-row gap-2 ${
                      pathname === "/reviewManagement" && "text-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 0-7.5 0v.75a.75.75 0 0 1-.75.75H6a3 3 0 0 0-3 3v4.5a3 3 0 0 0 3 3h.75a.75.75 0 0 1 .75.75v.75a3.75 3.75 0 1 0 7.5 0v-.75a.75.75 0 0 1 .75-.75H18a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-.75a.75.75 0 0 1-.75-.75Z"
                      />
                    </svg>

                    <span>Review Management</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/bookingCalendar">
                  <div
                    className={`flex flex-row gap-2 ${
                      pathname === "/bookingCalendar" && "text-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                      />
                    </svg>

                    <span>Booking Calendar</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/userList">
                  <div
                    className={`flex flex-row gap-2 ${
                      pathname === "/userList" && "text-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                      />
                    </svg>
                    <span>User Data</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/manualBooking">
                  {" "}
                  <div
                    className={`flex flex-row gap-2 ${
                      pathname === "/manualBooking" && "text-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                      />
                    </svg>

                    <span>Manual Booking</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/branchManagement">
                  <div
                    className={`flex flex-row gap-2 ${
                      pathname === "/branchManagement" && "text-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
                      />
                    </svg>

                    <span>Branch Management</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/packageManagement">
                  <div
                    className={`flex flex-row gap-2 ${
                      pathname === "/packageManagement" && "text-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 7.5l9 4.5 9-4.5M3 7.5v9l9 4.5 9-4.5v-9M3 7.5L12 3l9 4.5"
                      />
                    </svg>

                    <span>Package Management</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/staffManagement">
                  <div
                    className={`flex flex-row gap-2 ${
                      pathname === "/staffManagement" && "text-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                      />
                    </svg>

                    <span>Staff Management</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/voucherManagement">
                  <div
                    className={`flex flex-row gap-2 ${
                      pathname === "/voucherManagement" && "text-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                      />
                    </svg>
                    <span>Voucher Management</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full overflow-hidden">
                <Image
                  alt={displayName}
                  src={avatarUrl}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover"
                  unoptimized
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-between gap-2 text-left"
                  disabled={isLoggingOut}
                >
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                  {isLoggingOut && (
                    <span className="loading loading-spinner loading-xs text-primary" />
                  )}
                </button>
              </li>
              {logoutError && (
                <li
                  className="pointer-events-none px-2 pt-1 text-xs text-red-500"
                  role="alert"
                >
                  {logoutError}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
