"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FolderOpen,
  Plus,
  Upload,
  Download,
  Trash2,
  FileText,
  Link2,
  ExternalLink,
  X,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
const BASE = `${API_ROOT}/api/student/portfolio`;

const CATEGORIES = ["CV", "Certificate", "Project", "Other"];
const label = (c) => (c === "CV" ? "CV / Resume" : c);

function authHeaders() {
  const h = {};
  try {
    const t = localStorage.getItem("token");
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {}
  return h;
}

async function request(path = "", { method = "GET", body } = {}) {
  const headers = authHeaders();
  if (typeof body === "string") headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, { method, headers, body });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "Something went wrong. Please try again.");
  }
  return res;
}

const formatSize = (bytes = 0) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const inputCls =
  "mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-text outline-none focus:border-primary";

function AddItemModal({ onClose, onDone }) {
  const [kind, setKind] = useState("file");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("CV");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [shared, setShared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!title.trim()) return setError("Enter a title.");
    if (kind === "file") {
      if (!file) return setError("Choose a PDF to upload.");
      if (file.size > 5 * 1024 * 1024) return setError("PDF must be 5 MB or smaller.");
    } else if (!url.trim()) {
      return setError("Paste the web link.");
    }

    const body = new FormData();
    body.append("kind", kind);
    body.append("title", title.trim());
    body.append("category", category);
    body.append("description", description.trim());
    body.append("shared", String(shared));
    if (kind === "file") body.append("file", file);
    else body.append("url", url.trim());

    setBusy(true);
    try {
      await request("", { method: "POST", body });
      onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const tab = (value, text, Icon) => (
    <button
      type="button"
      onClick={() => setKind(value)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
        kind === value ? "bg-primary text-white" : "bg-blue-50 text-text hover:bg-blue-100"
      }`}
    >
      <Icon size={15} /> {text}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-sidebar">Add to portfolio</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            {tab("file", "Upload PDF", FileText)}
            {tab("link", "Add link", Link2)}
          </div>

          <label className="block text-sm font-medium text-text">
            Title
            <input
              value={title}
              maxLength={150}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === "file" ? "e.g. My CV 2026" : "e.g. My GitHub projects"}
              className={inputCls}
            />
          </label>

          <label className="block text-sm font-medium text-text">
            Type
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </label>

          {kind === "file" ? (
            <div>
              <span className="block text-sm font-medium text-text">PDF file</span>
              <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-muted hover:border-primary">
                <Upload size={18} className="text-primary" />
                <span className="truncate">{file ? file.name : "Choose a PDF, up to 5 MB"}</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          ) : (
            <label className="block text-sm font-medium text-text">
              Web link
              <input
                value={url}
                maxLength={500}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/you or your portfolio site"
                className={inputCls}
              />
              <span className="mt-1 block text-xs font-normal text-muted">
                Use a page that has the details: GitHub, a personal site, Google Drive, LinkedIn. Make sure anyone with the link can open it.
              </span>
            </label>
          )}

          <label className="block text-sm font-medium text-text">
            Description (optional)
            <textarea
              value={description}
              maxLength={300}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={shared}
              onChange={(e) => setShared(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300"
            />
            <span>
              Let alumni I apply to or request mentorship from see this
              <span className="block text-xs text-muted">You can change this later. It is off by default.</span>
            </span>
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium text-text hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {kind === "file" ? "Upload" : "Add link"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioSection() {
  const [files, setFiles] = useState([]);
  const [maxFiles, setMaxFiles] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await request();
      const json = await res.json();
      setFiles(json.files || []);
      if (json.maxFiles) setMaxFiles(json.maxFiles);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const download = async (f) => {
    setBusyId(f.id);
    try {
      const res = await request(`/${f.id}/download`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.fileName || "portfolio.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.message);
    }
    setBusyId(null);
  };

  const remove = async (f) => {
    setBusyId(f.id);
    try {
      await request(`/${f.id}`, { method: "DELETE" });
      setConfirmId(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setBusyId(null);
  };

  const toggleShare = async (f) => {
    setBusyId(f.id);
    try {
      await request(`/${f.id}/share`, { method: "PATCH", body: JSON.stringify({ shared: !f.shared }) });
      await load();
    } catch (e) {
      setError(e.message);
    }
    setBusyId(null);
  };

  const atLimit = files.length >= maxFiles;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sidebar">
            <FolderOpen size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Portfolio</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Add a PDF or a web link with the details of your work. Items are private unless you choose to share them.
          </p>
        </div>

        <button
          onClick={() => setAdding(true)}
          disabled={atLimit}
          title={atLimit ? `You can keep up to ${maxFiles} items` : undefined}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="py-6 text-center text-sm text-muted">Loading portfolio...</p>
      ) : files.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          Nothing here yet. Add your CV as a PDF, or a link to your projects.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {files.map((f) => (
            <li key={f.id} className="flex items-start gap-3 py-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-primary">
                {f.kind === "link" ? <Link2 size={18} /> : <FileText size={18} />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sidebar">{f.title}</p>
                <p className="text-xs text-muted">
                  {label(f.category)} · {f.kind === "link" ? hostOf(f.url) : `PDF · ${formatSize(f.size)}`} ·{" "}
                  {formatDate(f.uploadedAt)}
                </p>
                {f.description && <p className="mt-1 text-xs text-text">{f.description}</p>}
                <span
                  className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    f.shared ? "bg-green-100 text-green-700" : "bg-gray-100 text-muted"
                  }`}
                >
                  {f.shared ? "Visible to alumni you contact" : "Only you"}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {confirmId === f.id ? (
                  <>
                    <button
                      onClick={() => remove(f)}
                      disabled={busyId === f.id}
                      className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-text hover:bg-gray-100"
                    >
                      Keep
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => toggleShare(f)}
                      disabled={busyId === f.id}
                      aria-label={f.shared ? `Stop sharing ${f.title}` : `Share ${f.title}`}
                      title={f.shared ? "Stop sharing" : "Share with alumni you contact"}
                      className="rounded-md p-2 text-muted hover:bg-gray-100 hover:text-primary disabled:opacity-60"
                    >
                      {f.shared ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {f.kind === "link" ? (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${f.title}`}
                        className="rounded-md p-2 text-primary hover:bg-blue-50"
                      >
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      <button
                        onClick={() => download(f)}
                        disabled={busyId === f.id}
                        aria-label={`Download ${f.title}`}
                        className="rounded-md p-2 text-primary hover:bg-blue-50 disabled:opacity-60"
                      >
                        {busyId === f.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmId(f.id)}
                      aria-label={`Delete ${f.title}`}
                      className="rounded-md p-2 text-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <AddItemModal
          onClose={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            load();
          }}
        />
      )}
    </div>
  );
}