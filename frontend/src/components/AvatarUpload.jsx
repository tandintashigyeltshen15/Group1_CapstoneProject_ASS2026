"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import Avatar, { API_ORIGIN } from "./Avatar";

const MAX = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

// Keep the browser's saved user in step and tell the top bar to redraw
function announce(url) {
  try {
    const stored = JSON.parse(localStorage.getItem("user"));
    if (stored) localStorage.setItem("user", JSON.stringify({ ...stored, photoUrl: url }));
  } catch {}
  window.dispatchEvent(new CustomEvent("profile-photo-changed", { detail: url }));
}

export default function AvatarUpload({
  name,
  photoUrl,
  onChange,
  size = "h-28 w-28",
  text = "text-3xl",
  className = "",
}) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(method, body) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_ORIGIN}/api/profile-photo`, {
      method,
      headers: { Authorization: `Bearer ${token}` }, // no Content-Type: the browser sets it for files
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Something went wrong");
    return data;
  }

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError("Use a JPG, PNG or WebP image.");
    if (file.size > MAX) return setError("Photo must be 2 MB or smaller.");

    setError("");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("photo", file);
      const { photoUrl: url } = await send("POST", form);
      onChange(url);
      announce(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError("");
    setBusy(true);
    try {
      await send("DELETE");
      onChange("");
      announce("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <Avatar name={name} photoUrl={photoUrl} size={size} text={text} className={className} />
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="hidden" />
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex items-center gap-1 font-medium text-primary hover:underline disabled:opacity-60"
        >
          <Camera size={13} /> {busy ? "Uploading..." : photoUrl ? "Change" : "Add photo"}
        </button>
        {photoUrl && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="flex items-center gap-1 text-danger hover:underline disabled:opacity-60"
          >
            <Trash2 size={13} /> Remove
          </button>
        )}
      </div>
      {error && <p className="max-w-40 text-center text-xs text-danger">{error}</p>}
    </div>
  );
}