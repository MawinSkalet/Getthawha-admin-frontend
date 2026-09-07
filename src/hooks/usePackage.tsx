import IPackage from "@/interfaces/IPackage";
import IPackageInput from "@/interfaces/IPackageInput";
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

  if (response.status == 401 || response.status == 500) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }

  const data: IPackage[] = await response.json();
  return data;
}

async function createPackage(
  packageData: IPackageInput,
  abortSignal: AbortSignal
) {
  const response = await fetch(
    `${getBaseUrl()}/admin/package`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(packageData),
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
  const data: IPackage = await response.json();
  return data;
}

async function updatePackage(
  id: string,
  packageData: IPackageInput,
  abortSignal: AbortSignal
) {
  const response = await fetch(
    `${getBaseUrl()}/admin/package/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(packageData),
      signal: abortSignal,
      credentials: "include",
    }
  );
  if (
    response.status == 401 ||
    response.status == 400 ||
    response.status == 500 ||
    response.status == 404
  ) {
    const errorResponse: IErrorResponse = await response.json();
    return errorResponse;
  }
  const data: IPackage = await response.json();
  return data;
}

async function deletePackage(id: string, abortSignal: AbortSignal) {
  const response = await fetch(
    `${getBaseUrl()}/admin/package/${id}`,
    {
      method: "DELETE",
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

  // Check if response has content before trying to parse JSON
  const text = await response.text();
  if (text) {
    try {
      const data: { message: string } = JSON.parse(text);
      return data;
    } catch {
      // If JSON parsing fails, return a default success message
      return { message: "Package deleted successfully" };
    }
  } else {
    // If no content, return a default success message
    return { message: "Package deleted successfully" };
  }
}

export { getAllPackages, createPackage, updatePackage, deletePackage };
