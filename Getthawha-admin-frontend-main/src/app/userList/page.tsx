"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { getAllUsers, USER_PAGE_LIMIT } from "@/hooks/useUser";
import type IUser from "@/interfaces/IUser";
import type IErrorResponse from "@interfaces/IErrorResponse";
import AdminNavbar from "@/components/AdminNavBar";
import Link from "next/link";

const UserList: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFetchError = useCallback(
    (result: IErrorResponse | Error, append: boolean) => {
      const message =
        "status" in result
          ? result.message || "Failed to fetch users"
          : "Failed to fetch users";
      setError(message);
      if (!append) {
        setUsers([]);
        setHasMore(false);
        setCurrentPage(1);
      }
    },
    []
  );

  const fetchUsers = useCallback(
    async (page: number, append = false) => {
      const abortController = new AbortController();
      abortControllerRef.current?.abort();
      abortControllerRef.current = abortController;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await getAllUsers(page, abortController.signal);

        if (abortController.signal.aborted) {
          return;
        }

        if (!Array.isArray(result)) {
          handleFetchError(result, append);
          return;
        }

        setUsers((prev) => {
          if (!append) {
            return result;
          }

          const existingIds = new Set(prev.map((user) => user.id));
          const merged = [...prev];

          result.forEach((user) => {
            if (!existingIds.has(user.id)) {
              merged.push(user);
              existingIds.add(user.id);
            }
          });

          return merged;
        });

        setCurrentPage(page);
        setHasMore(result.length >= USER_PAGE_LIMIT);
      } catch (err) {
        const error = err as Error;
        if (error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch users:", error);
        handleFetchError(error, append);
      } finally {
        if (!abortController.signal.aborted) {
          if (append) {
            setLoadingMore(false);
          } else {
            setLoading(false);
          }
        }
      }
    },
    [handleFetchError]
  );

  useEffect(() => {
    fetchUsers(1, false);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchUsers]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        user.displayName.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    fetchUsers(currentPage + 1, true);
  }, [fetchUsers, currentPage, loading, loadingMore, hasMore]);

  const renderLoadMore = useCallback(
    (spacingClass = "mt-8") => {
      if (!hasMore) {
        return null;
      }

      return (
        <div className={`flex justify-center ${spacingClass}`}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm" />
                Loading...
              </span>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      );
    },
    [hasMore, handleLoadMore, loadingMore]
  );

  return (
    <>
      <AdminNavbar />
      <div className="p-6 bg-base-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">All Users</h1>
        <div className="mb-6 flex justify-end">
          <input
            type="text"
            placeholder="Search by name..."
            className="input input-bordered w-full max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {error && (
          <div className="alert alert-error mb-6" role="alert">
            {error}
          </div>
        )}

        {loading && users.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-gray-500">
            {search
              ? `No users matched "${search}".`
              : "No users found."}
            {renderLoadMore("mt-4")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/userList/${user.id}`}
                  className="card bg-base-200 shadow-md hover:shadow-xl transition"
                >
                  <div className="card-body items-center text-center">
                    <div className="avatar mb-2">
                      <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <Image
                          src={user.pictureUrl || "https://i.pravatar.cc/100"}
                          alt={user.displayName}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                    <h2 className="card-title">{user.displayName}</h2>
                  </div>
                </Link>
              ))}
            </div>
            {renderLoadMore()}
          </>
        )}
      </div>
    </>
  );
};

export default UserList;
