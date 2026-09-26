export function getBaseUrl(): string {
  if (typeof window === "undefined") {
    // Server-side execution (Node.js/Next.js server inside Docker container)
    return (
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://backend:8000"
    );
  }
  // Client-side execution (User's browser)
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
}
