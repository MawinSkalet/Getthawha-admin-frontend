import IPackage from "@/interfaces/IPackage";
import IPackageGroupInput from "@/interfaces/IPackageGroupInput";
import type IErrorResponse from "@interfaces/IErrorResponse";
import { getBaseUrl } from "@/lib/api";

async function getAllPackages(abortSignal: AbortSignal) {
  const response = await fetch(
    `${getBaseUrl()}/admin/package`,
    {
      method: "GET",
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorResponse: IErrorResponse = await response
      .json()
      .catch(() => ({ message: `Could not load the menu (${response.status}).` }));
    return errorResponse;
  }

  const data: IPackage[] = await response.json();
  return data;
}

async function savePackageGroup(
  id: string | null,
  packageData: IPackageGroupInput,
  abortSignal: AbortSignal
) {
  const response = await fetch(
    id
      ? `${getBaseUrl()}/admin/package/group/${id}`
      : `${getBaseUrl()}/admin/package/group`,
    {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(packageData),
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }
  return (await response.json()) as IPackage[];
}

async function deletePackageGroup(id: string, abortSignal: AbortSignal) {
  const response = await fetch(`${getBaseUrl()}/admin/package/group/${id}`, {
    method: "DELETE",
    signal: abortSignal,
    credentials: "include",
  });
  if (!response.ok && response.status !== 204) {
    return (await response.json()) as IErrorResponse;
  }
  return { message: "Package group deleted successfully" };
}

export {
  getAllPackages,
  savePackageGroup,
  deletePackageGroup,
};
