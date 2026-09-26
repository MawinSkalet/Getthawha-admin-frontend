import type IBranch from "@interfaces/IBranch";
import type IErrorResponse from "@interfaces/IErrorResponse";
import type IBranchInput from "@interfaces/IBranchInput";
import { getBaseUrl } from "@/lib/api";

async function getAllBranch(abortSignal: AbortSignal) {
  const response = await fetch(
    `${getBaseUrl()}/admin/branch`,
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

  const data: IBranch[] = await response.json();
  return data;
}

async function createBranch(branch: IBranchInput, abortSignal: AbortSignal) {
  const response = await fetch(
    `${getBaseUrl()}/admin/branch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: branch.name,
        address: branch.address,
        googleMapUrl: branch.googleMapUrl,
        phone: branch.phone,
        pictureUrl: branch.pictureUrl ?? "",
        googleMapEmbedUrl: branch.googleMapEmbedUrl ?? "",
        description: branch.description ?? "",
      }),
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status == 401 ||
    response.status == 400 ||
    response.status == 500
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: IBranch = await response.json();
  return data;
}

async function updateBranch(
  id: string,
  branch: IBranchInput,
  abortSignal: AbortSignal
) {
  const response = await fetch(
    `${getBaseUrl()}/admin/branch/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: branch.name,
        address: branch.address,
        googleMapUrl: branch.googleMapUrl,
        phone: branch.phone,
        pictureUrl: branch.pictureUrl ?? "",
        googleMapEmbedUrl: branch.googleMapEmbedUrl ?? "",
        description: branch.description ?? "",
      }),
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status == 401 ||
    response.status == 404 ||
    response.status == 400 ||
    response.status == 500
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: IBranch = await response.json();
  return data;
}

async function deleteBranch(id: string, abortSignal: AbortSignal) {
  const response = await fetch(
    `${getBaseUrl()}/admin/branch/${id}`,
    {
      method: "DELETE",
      signal: abortSignal,
      credentials: "include",
    }
  );

  if (
    response.status == 401 ||
    response.status == 404 ||
    response.status == 500
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  return { message: "Branch deleted successfully" };
}

export { getAllBranch, createBranch, deleteBranch, updateBranch };
