const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function api(path, options = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  // Detect FormData so the browser can set the multipart boundary automatically
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  let res;

  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  const data = await res.json().catch(() => ({}));

  // An expired or invalid token on a protected call: sign the user out
  if (res.status === 401 && token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  if (!res.ok) {
    const error = new Error(data.message || "Something went wrong");

    // Preserve the complete backend error response
    error.status = res.status;
    error.data = data;
    error.rejectionReason = data.rejectionReason || "";

    throw error;
  }

  return data;
}