const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Turns a path returned by the backend ("/contributions/...") into a full URL
export const fileUrl = (path) => (path ? `${API}${path}` : "");

// POST a FormData body. The browser sets the multipart Content-Type itself.
export async function uploadForm(path, formData) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}