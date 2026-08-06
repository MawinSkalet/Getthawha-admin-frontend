import type IErrorResponse from "@interfaces/IErrorResponse";
import IStaff from "@/interfaces/IStaff";
import IStaffInput from "@/interfaces/IStaffInput";

type StaffApiUser = {
  id: string;
  username?: string;
  userName?: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
};

async function getAllStaff(abortSignal: AbortSignal) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/auth`,
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

  const data = await response.json();

  if (data && data.status === "error") {
    const errorResponse: IErrorResponse = {
      status: data.status,
      message: data.message ?? "Failed to fetch staff",
    };
    return errorResponse;
  }

  if (!data || !Array.isArray(data.users)) {
    const unexpectedResponse: IErrorResponse = {
      status: "error",
      message: "Unexpected response from server",
    };
    return unexpectedResponse;
  }

  const staffList: IStaff[] = data.users.map((user: StaffApiUser) => ({
    id: user.id,
    userName: user.username ?? user.userName,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  return staffList;
}

async function createStaff(staff: IStaffInput, abortSignal: AbortSignal) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: staff.userName,
        email: staff.email,
        password: staff.password,
      }),
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status == 401 ||
    response.status == 400 ||
    response.status == 409 ||
    response.status == 500
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data = await response.json();

  if (!data || !data.user) {
    const unexpectedResponse: IErrorResponse = {
      status: "error",
      message: "Unexpected response from server",
    };
    return unexpectedResponse;
  }

  const staffResponse: IStaff = {
    id: data.user.id,
    userName: data.user.username ?? data.user.userName,
    email: data.user.email,
    createdAt: data.user.createdAt,
    updatedAt: data.user.updatedAt,
  };

  return staffResponse;
}

async function deleteStaff(id: string, abortSignal: AbortSignal) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/auth/delete/${id}`,
    {
      method: "DELETE",
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status == 401 ||
    response.status == 400 ||
    response.status == 404 ||
    response.status == 500
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  return { success: true };
}

export { getAllStaff, createStaff, deleteStaff };
