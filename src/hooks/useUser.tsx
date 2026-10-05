import type IUser from "@/interfaces/IUser";
import type IErrorResponse from "@interfaces/IErrorResponse";
import { getBaseUrl } from "@/lib/api";

const USER_PAGE_LIMIT = 10;

async function getAllUsers(
  page = 1,
  abortSignal: AbortSignal
): Promise<IUser[] | IErrorResponse> {
  const response = await fetch(
    `${getBaseUrl()}/admin/user?page=${page}`,
    {
      method: "GET",
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (response.status === 401 || response.status === 500) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: IUser[] = await response.json();
  return data;
}

async function getUserById(userId: string, abortSignal: AbortSignal) {
  const response = await fetch(
    `${getBaseUrl()}/admin/user/${encodeURIComponent(userId)}`,
    {
      method: "GET",
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status == 401 ||
    response.status == 500 ||
    response.status == 404
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: IUser = await response.json();
  return data;
}

async function updateUserById(
  userId: string,
  updates: Pick<IUser, "displayName" | "email" | "phone" | "address">
): Promise<IUser | IErrorResponse> {
  const response = await fetch(
    `${getBaseUrl()}/admin/user/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    }
  );

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : "Failed to update user profile";
    return { status: "error", message };
  }

  return data as IUser;
}

async function searchUser(displayName: string, abortSignal: AbortSignal) {
  const response = await fetch(
    `${getBaseUrl()}/admin/user/search?query=${displayName}`,
    {
      method: "GET",
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (response.status == 401 || response.status == 500) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: IUser[] = await response.json();
  return data;
}

export { getAllUsers, getUserById, updateUserById, searchUser, USER_PAGE_LIMIT };
