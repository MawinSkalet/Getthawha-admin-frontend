import type IErrorResponse from "@/interfaces/IErrorResponse";

interface ILogoutSuccess {
  success: true;
  message?: string;
}

type LogoutResponse = ILogoutSuccess | IErrorResponse;

async function logout(abortSignal?: AbortSignal): Promise<LogoutResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/auth/logout`,
    {
      method: "POST",
      credentials: "include",
      signal: abortSignal,
    }
  );

  if (!response.ok) {
    try {
      const errorResponse: IErrorResponse = await response.json();
      return errorResponse;
    } catch (error) {
      console.error("Failed to parse logout error response:", error);
      return {
        status: "error",
        message: "Failed to log out. Please try again.",
      };
    }
  }

  if (response.status === 204) {
    return { success: true };
  }

  try {
    const data = await response.json();
    return {
      success: true,
      message: data?.message,
    };
  } catch (error) {
    console.warn("Logout succeeded but response body was empty:", error);
    return { success: true };
  }
}

export { logout };
export type { LogoutResponse };
