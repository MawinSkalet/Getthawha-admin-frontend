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
    `${getBaseUrl()}/admin/user/${userId}`,
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

export { getAllUsers, getUserById, searchUser, USER_PAGE_LIMIT };
