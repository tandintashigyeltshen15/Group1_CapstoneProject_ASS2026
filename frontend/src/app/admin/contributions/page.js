"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Megaphone, Coins, Clock, Users, Plus, List, CircleCheck, CircleX, Landmark,
  Search, Calendar, ArrowRight, Pencil, Lock, Trash2, Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import { uploadForm, fileUrl } from "@/lib/files";
import { Card, Badge, EmptyState, Field, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";
import {
  Avatar, Modal, Tabs, Table, nu, statusTone, btnSm, btnDanger, btnSuccess,
} from "@/components/AdminUI";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  "Scholarships",
  "Laboratory Upgrade",
  "Library Development",
  "Campus Infrastructure",
  "Student Activities",
  "Other",
];

const CONTRIBUTION_TYPES = ["Monetary", "Equipment", "Other"];

const CAMPAIGN_STYLE = {
  Open: "bg-green-100 text-success",
  Completed: "bg-blue-100 text-primary",
  Draft: "bg-gray-100 text-muted",
  Closed: "bg-red-50 text-danger",
};

const EMPTY_FORM = {
  title: "",
  category: "",
  type: "Monetary",
  target: "",
  deadline: "",
  description: "",
  imageUrl: "",
};

const EMPTY_BANK = { bankName: "", accountName: "", accountNumber: "", branch: "", updatedAt: "" };

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "-";

// a freshly chosen picture is a local "blob:" preview; a saved one is a path from the backend
const imgSrc = (url) => (url && url.startsWith("blob:") ? url : fileUrl(url));

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function CampaignBadge({ status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${CAMPAIGN_STYLE[status] || CAMPAIGN_STYLE.Draft}`}>
      {status}
    </span>
  );
}

function StatCard({ icon: Icon, tile, label, value, footer }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tile}`}>
        <Icon size={26} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-sidebar">{label}</p>
        <p className="text-2xl font-bold text-sidebar">{value}</p>
        {footer}
      </div>
    </div>
  );
}

function Progress({ value, label }) {
  return (
    <div
      className="h-2 w-full rounded bg-gray-100"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-2 rounded bg-success" style={{ width: `${value}%` }} />
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <div className="text-sm font-medium text-sidebar">{children || "-"}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminContributionsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [bank, setBank] = useState(EMPTY_BANK);

  const [tab, setTab] = useState("requests");
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(false);

  // filters for the payments tables
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [campaignFilter, setCampaignFilter] = useState("All");

  // modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [formError, setFormError] = useState("");

  const [detailId, setDetailId] = useState(null);

  const [reviewId, setReviewId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [reviewError, setReviewError] = useState("");

  const [bankOpen, setBankOpen] = useState(false);
  const [bankForm, setBankForm] = useState(EMPTY_BANK);
  const [bankError, setBankError] = useState("");

  /* ----------------------------- loading ----------------------------- */

  const load = async () => {
    try {
      const d = await api("/contributions/admin/overview");
      setCampaigns(d.campaigns);
      setContributions(d.contributions);
      setBank(d.bank);
    } catch (err) {
      setFlash({ tone: "red", text: err.message });
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ------------------------- derived values ------------------------- */

  const verified = useMemo(() => contributions.filter((c) => c.status === "Verified"), [contributions]);
  const pending = useMemo(() => contributions.filter((c) => c.status === "Pending"), [contributions]);

  const totalVerified = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const totalContributors = new Set(verified.map((c) => c.email || c.donor)).size;
  const activeCampaigns = campaigns.filter((c) => c.displayStatus === "Open");

  const campaignTitle = (campaignId) => campaigns.find((c) => c.id === campaignId)?.title || "Removed request";

  const rows = useMemo(() => {
    let list = contributions.slice();
    if (tab === "pending") list = list.filter((c) => c.status === "Pending");
    if (tab === "verified") list = list.filter((c) => c.status === "Verified");
    if (tab === "all") {
      if (statusFilter !== "All") list = list.filter((c) => c.status === statusFilter);
    }
    if (campaignFilter !== "All") list = list.filter((c) => c.campaignId === campaignFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        [c.donor, c.reference, c.email].some((v) => String(v || "").toLowerCase().includes(q))
      );
    }
    // oldest first when something needs a decision, newest first otherwise
    return list.sort((a, b) =>
      tab === "pending"
        ? new Date(a.submittedAt) - new Date(b.submittedAt)
        : new Date(b.submittedAt) - new Date(a.submittedAt)
    );
  }, [contributions, tab, statusFilter, campaignFilter, search]);

  const detail = campaigns.find((c) => c.id === detailId);
  const review = contributions.find((c) => c.id === reviewId);

  /* ----------------------------- campaigns ----------------------------- */

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (campaign) => {
    setEditingId(campaign.id);
    setForm({
      title: campaign.title,
      category: campaign.category,
      type: campaign.type,
      target: String(campaign.target),
      deadline: campaign.deadline,
      description: campaign.description,
      imageUrl: campaign.imageUrl || "",
    });
    setImageFile(null);
    setFormError("");
    setDetailId(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setImageFile(null);
    setFormError("");
  };

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setFormError("The image must be a JPG or PNG file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must be 5 MB or smaller.");
      return;
    }
    setImageFile(file);
    setForm((f) => ({ ...f, imageUrl: URL.createObjectURL(file) }));
    setFormError("");
  };

  const saveCampaign = async (publish) => {
    const target = Number(form.target);
    if (!form.title.trim() || !form.category || !form.deadline || !form.description.trim()) {
      setFormError("Fill in the title, category, deadline and description.");
      return;
    }
    if (!(target > 0)) {
      setFormError("Enter a target amount greater than 0.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      type: form.type,
      target: form.target,
      deadline: form.deadline,
      description: form.description.trim(),
    };

    setBusy(true);
    setFormError("");
    try {
      let id = editingId;
      if (editingId) {
        await api(`/contributions/campaigns/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        const res = await api("/contributions/campaigns", {
          method: "POST",
          body: JSON.stringify({ ...payload, publish }),
        });
        id = res.campaign.id;
      }

      // the picture goes up separately; the request itself is already saved
      let imageNote = "";
      if (imageFile) {
        try {
          const fd = new FormData();
          fd.append("image", imageFile);
          await uploadForm(`/contributions/campaigns/${id}/image`, fd);
        } catch (err) {
          imageNote = ` The image could not be uploaded: ${err.message}`;
        }
      }

      const text = editingId
        ? `"${payload.title}" was updated.`
        : publish
        ? `"${payload.title}" was published.`
        : `"${payload.title}" was saved as a draft.`;
      setFlash({ tone: imageNote ? "red" : "green", text: text + imageNote });
      closeForm();
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const setCampaignStatus = async (campaign, status) => {
    setBusy(true);
    try {
      await api(`/contributions/campaigns/${campaign.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setFlash({ tone: "green", text: `"${campaign.title}" is now ${status.toLowerCase()}.` });
      setDetailId(null);
      await load();
    } catch (err) {
      setFlash({ tone: "red", text: err.message });
      setDetailId(null);
    } finally {
      setBusy(false);
    }
  };

  const deleteCampaign = async (campaign) => {
    if (!window.confirm(`Delete "${campaign.title}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      await api(`/contributions/campaigns/${campaign.id}`, { method: "DELETE" });
      setFlash({ tone: "green", text: `"${campaign.title}" was deleted.` });
      setDetailId(null);
      await load();
    } catch (err) {
      setFlash({ tone: "red", text: err.message });
      setDetailId(null);
    } finally {
      setBusy(false);
    }
  };

  const viewContributions = (campaign) => {
    setCampaignFilter(campaign.id);
    setStatusFilter("All");
    setSearch("");
    setTab("all");
    setDetailId(null);
  };

  /* ----------------------------- payments ----------------------------- */

  const closeReview = () => {
    setReviewId(null);
    setRemarks("");
    setReviewError("");
  };

  const decide = async (status) => {
    if (status === "Rejected" && remarks.trim().length < 5) {
      setReviewError("Add a remark (at least 5 characters) so the contributor knows what to fix.");
      return;
    }
    const donor = review.donor;
    setBusy(true);
    setReviewError("");
    try {
      await api(`/contributions/${review.id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ status, remarks: remarks.trim() }),
      });
      setFlash({
        tone: status === "Verified" ? "green" : "red",
        text: `Payment from ${donor} was ${status.toLowerCase()}. The contributor was notified.`,
      });
      closeReview();
      await load();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* --------------------------- bank details --------------------------- */

  const openBank = () => {
    setBankForm(bank);
    setBankError("");
    setBankOpen(true);
  };

  const saveBank = async (e) => {
    e.preventDefault();
    setBusy(true);
    setBankError("");
    try {
      const res = await api("/contributions/bank-details", {
        method: "PUT",
        body: JSON.stringify(bankForm),
      });
      setBank(res.bank);
      setBankOpen(false);
      setFlash({ tone: "green", text: "Official bank details were updated." });
    } catch (err) {
      setBankError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const bankReady = bank.bankName && bank.accountName && bank.accountNumber;

  /* ------------------------------ render ------------------------------ */

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-sidebar">Contributions</h1>
          <p className="text-muted">Manage contribution requests and verify payments.</p>
        </div>
        <button type="button" className={btnPrimary} onClick={openCreate}>
          <Plus size={16} /> Create Request
        </button>
      </div>

      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Megaphone} tile="bg-blue-100 text-primary" label="Active Requests" value={activeCampaigns.length} />
        <StatCard icon={Coins} tile="bg-green-100 text-success" label="Total Contributions" value={nu(totalVerified)} />
        <StatCard
          icon={Clock}
          tile="bg-purple-100 text-accent"
          label="Pending Verification"
          value={pending.length}
          footer={
            pending.length > 0 && (
              <button type="button" onClick={() => setTab("pending")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Review now <ArrowRight size={12} />
              </button>
            )
          }
        />
        <StatCard icon={Users} tile="bg-orange-100 text-warning" label="Total Contributors" value={totalContributors} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left column */}
        <div className="min-w-0 space-y-6">
          <Tabs
            value={tab}
            onChange={(key) => {
              setTab(key);
              if (key !== "all") setStatusFilter("All");
            }}
            tabs={[
              { key: "requests", label: "Contribution Requests", count: campaigns.length, icon: Megaphone },
              { key: "pending", label: "Pending Payments", count: pending.length, icon: Clock },
              { key: "verified", label: "Verified", count: verified.length, icon: CircleCheck },
              { key: "all", label: "All", count: contributions.length, icon: List },
            ]}
          />

          {/* Requests tab */}
          {tab === "requests" && (
            <>
              {campaigns.length === 0 ? (
                <Card title="Contribution Requests" icon={Megaphone}>
                  <EmptyState message="No contribution requests yet. Use Create Request to publish the first one." />
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {campaigns.map((c) => (
                    <div key={c.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex gap-4 p-4">
                        {c.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imgSrc(c.imageUrl)} alt="" className="h-24 w-28 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-24 w-28 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                            <Megaphone size={28} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sidebar">{c.title}</p>
                            <CampaignBadge status={c.displayStatus} />
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>
                        </div>
                      </div>
                      <div className="px-4">
                        <Progress value={c.percent} label={`${c.title} progress`} />
                        <div className="mt-1.5 flex items-center justify-between text-xs">
                          <span className="text-sidebar">{nu(c.raised)} / {nu(c.target)}</span>
                          <span className="font-semibold text-success">{c.percent}% funded</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><Calendar size={13} /> Deadline: {formatDate(c.deadline)}</span>
                        <span className="flex items-center gap-1"><Users size={13} /> {c.contributors} contributor{c.contributors === 1 ? "" : "s"}</span>
                        <button type="button" onClick={() => setDetailId(c.id)} className="flex items-center gap-1 font-medium text-primary hover:underline">
                          View Details <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Payment tabs */}
          {tab !== "requests" && (
            <Card
              title={
                tab === "pending" ? "Pending Payments" : tab === "verified" ? "Verified Contributions" : "Contribution History"
              }
              icon={List}
              action={
                campaignFilter !== "All" ? (
                  <button type="button" onClick={() => setCampaignFilter("All")} className="text-xs font-medium text-primary hover:underline">
                    Clear filter: {campaignTitle(campaignFilter)}
                  </button>
                ) : null
              }
            >
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative min-w-[200px] flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    className={`${inputCls} !pl-9`}
                    placeholder="Search by name, email or reference"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search contributions"
                  />
                </div>
                {tab === "all" && (
                  <select
                    className={`${inputCls} !w-auto`}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter by status"
                  >
                    {["All", "Pending", "Verified", "Rejected"].map((s) => (
                      <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>
                    ))}
                  </select>
                )}
              </div>

              <Table
                head={["#", "Contributor", "Request", "Amount", "Date", "Status", "Action"]}
                empty={rows.length === 0 && <EmptyState message="No contributions to show here yet." />}
              >
                {rows.map((c, i) => (
                  <tr key={c.id}>
                    <td className="px-3 py-3 text-sidebar">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.donor} />
                        <div>
                          <p className="font-medium text-sidebar">{c.donor}</p>
                          <p className="text-xs text-muted">{c.donorType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-text">{campaignTitle(c.campaignId)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-text">{nu(c.amount)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-text">{formatDate(c.date)}</td>
                    <td className="px-3 py-3"><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                    <td className="px-3 py-3">
                      <button type="button" className={btnSm} onClick={() => setReviewId(c.id)}>
                        {c.status === "Pending" ? "Review" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card
            title="Institution Account"
            icon={Landmark}
            action={
              <button type="button" onClick={openBank} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Pencil size={13} /> {bankReady ? "Edit Details" : "Add Details"}
              </button>
            }
          >
            {bankReady ? (
              <dl className="space-y-3">
                <Detail label="Bank name">{bank.bankName}</Detail>
                <Detail label="Account name">{bank.accountName}</Detail>
                <Detail label="Account number">{bank.accountNumber}</Detail>
                <Detail label="Branch">{bank.branch}</Detail>
                <p className="text-xs text-muted">Last updated {formatDate(bank.updatedAt)}</p>
                <p className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-sidebar">
                  <Lock size={14} className="mt-0.5 shrink-0 text-primary" />
                  Staff and alumni see these details on the payment page. Only admins can change them.
                </p>
              </dl>
            ) : (
              <EmptyState message="No bank details yet. Staff and alumni can't pay until you add the official CST account." />
            )}
          </Card>

          <Card title="Needs Verification" icon={Clock}>
            {pending.length === 0 ? (
              <EmptyState message="Nothing is waiting for verification." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {pending.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-warning" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-sidebar">{c.donor}</p>
                      <p className="truncate text-xs text-muted">{formatDate(c.date)} • {nu(c.amount)}</p>
                    </div>
                    <button type="button" className={btnSm} onClick={() => setReviewId(c.id)}>Review</button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Create / edit request */}
      {formOpen && (
        <Modal
          title={editingId ? "Edit Contribution Request" : "Create Contribution Request"}
          onClose={closeForm}
          width="max-w-2xl"
          footer={
            <>
              <button type="button" className={btnOutline} onClick={closeForm}>Cancel</button>
              {!editingId && (
                <button type="button" className={`${btnOutline} disabled:opacity-60`} disabled={busy} onClick={() => saveCampaign(false)}>
                  Save as draft
                </button>
              )}
              <button type="button" className={`${btnPrimary} disabled:opacity-60`} disabled={busy} onClick={() => saveCampaign(true)}>
                {busy ? "Saving..." : editingId ? "Save changes" : "Publish request"}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Request title *">
                <input className={inputCls} maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Computer Laboratory Upgrade" />
              </Field>
            </div>
            <Field label="Category *">
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Contribution type *">
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {CONTRIBUTION_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <p className="mt-1 text-xs text-muted">Only Monetary requests accept payments with a bank receipt.</p>
            </Field>
            <Field label="Target amount (Nu.) *">
              <input className={inputCls} type="number" min="1" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="e.g. 200000" />
            </Field>
            <Field label="Deadline *">
              <input className={inputCls} type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description *">
                <textarea
                  rows={4}
                  className={inputCls}
                  maxLength={5000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the purpose, the need and how the contribution will be used."
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Supporting image (optional, JPG or PNG, max 5 MB)">
                <input className={inputCls} type="file" accept="image/jpeg,image/png" onChange={onImage} />
              </Field>
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgSrc(form.imageUrl)} alt="Selected request" className="mt-2 h-24 rounded-lg object-cover" />
              )}
            </div>
          </div>
          {formError && <p className="mt-3 text-sm text-danger">{formError}</p>}
        </Modal>
      )}

      {/* Request details */}
      {detail && (
        <Modal
          title="Contribution Request Details"
          onClose={() => setDetailId(null)}
          width="max-w-2xl"
          footer={<button type="button" className={btnPrimary} onClick={() => setDetailId(null)}>Close window</button>}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-sidebar">{detail.title}</p>
              <p className="text-sm text-muted">{detail.category} • {detail.type}</p>
            </div>
            <CampaignBadge status={detail.displayStatus} />
          </div>

          {detail.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc(detail.imageUrl)} alt="" className="mb-4 h-48 w-full rounded-lg object-cover" />
          )}

          <div className="mb-4 grid grid-cols-3 gap-4">
            <Detail label="Target amount">{nu(detail.target)}</Detail>
            <Detail label="Deadline">{formatDate(detail.deadline)}</Detail>
            <Detail label="Contributors">{detail.contributors}</Detail>
          </div>

          <Progress value={detail.percent} label="Funding progress" />
          <p className="mt-1.5 text-xs text-sidebar">
            {nu(detail.raised)} collected • <span className="font-semibold text-success">{detail.percent}% funded</span>
          </p>
          {!detail.acceptsPayments && (
            <p className="mt-2 text-xs text-muted">This request doesn&apos;t accept payments through the portal.</p>
          )}

          <div className="mt-4">
            <p className="mb-1 text-xs text-muted">Description</p>
            <p className="whitespace-pre-line text-sm text-text">{detail.description}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            <button type="button" className={btnSm} onClick={() => viewContributions(detail)}><Eye size={14} /> View contributions</button>
            <button type="button" className={btnSm} onClick={() => openEdit(detail)}><Pencil size={14} /> Edit request</button>
            {detail.status === "Open" ? (
              <button type="button" className={btnSm} disabled={busy} onClick={() => setCampaignStatus(detail, "Closed")}>
                <Lock size={14} /> Close request
              </button>
            ) : (
              <button type="button" className={btnSm} disabled={busy} onClick={() => setCampaignStatus(detail, "Open")}>
                {detail.status === "Draft" ? "Publish request" : "Reopen request"}
              </button>
            )}
            <button type="button" className={btnDanger} disabled={busy} onClick={() => deleteCampaign(detail)}>
              <Trash2 size={14} /> Delete request
            </button>
          </div>
        </Modal>
      )}

      {/* Payment review */}
      {review && (
        <Modal
          title={review.status === "Pending" ? "Payment Verification" : "Contribution Details"}
          onClose={closeReview}
          width="max-w-2xl"
          footer={
            review.status === "Pending" ? (
              <>
                <button type="button" className={btnOutline} onClick={closeReview}>Cancel</button>
                <button type="button" className={`${btnDanger} disabled:opacity-60`} disabled={busy} onClick={() => decide("Rejected")}>
                  <CircleX size={16} /> Reject
                </button>
                <button type="button" className={`${btnSuccess} disabled:opacity-60`} disabled={busy} onClick={() => decide("Verified")}>
                  <CircleCheck size={16} /> {busy ? "Working..." : "Mark as verified"}
                </button>
              </>
            ) : (
              <button type="button" className={btnPrimary} onClick={closeReview}>Close window</button>
            )
          }
        >
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={review.donor} size="h-12 w-12" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sidebar">{review.donor}</p>
              <p className="truncate text-xs text-muted">{review.donorType}{review.email && ` • ${review.email}`}</p>
            </div>
            <Badge tone={statusTone[review.status]}>{review.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Detail label="Request">{campaignTitle(review.campaignId)}</Detail>
            <Detail label="Amount contributed">{nu(review.amount)}</Detail>
            <Detail label="Transaction reference">{review.reference}</Detail>
            <Detail label="Payment date">{formatDate(review.date)}</Detail>
            <Detail label="Proof of payment">
              {review.receiptUrl ? (
                <a href={fileUrl(review.receiptUrl)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  View receipt
                </a>
              ) : (
                "No receipt attached"
              )}
            </Detail>
            {review.anonymous && <Detail label="Visibility">Donor asked to stay anonymous in public lists</Detail>}
          </div>

          {review.status === "Rejected" && review.reason && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-danger">
              <p className="mb-1 text-xs">Reason for rejection</p>
              {review.reason}
            </div>
          )}

          {review.status === "Verified" && review.remarks && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-text">
              <p className="mb-1 text-xs text-muted">Remarks</p>
              {review.remarks}
            </div>
          )}

          {review.status === "Pending" && (
            <div className="mt-4">
              <Field label="Remarks (required if you reject)">
                <textarea
                  rows={3}
                  maxLength={250}
                  value={remarks}
                  onChange={(e) => { setRemarks(e.target.value); setReviewError(""); }}
                  className={inputCls}
                  placeholder="For example: the transaction reference doesn't match the receipt."
                />
              </Field>
              {reviewError && <p className="mt-1 text-xs text-danger">{reviewError}</p>}
            </div>
          )}
        </Modal>
      )}

      {/* Bank details */}
      {bankOpen && (
        <Modal
          title="Institution Account Details"
          onClose={() => setBankOpen(false)}
          footer={
            <>
              <button type="button" className={btnOutline} onClick={() => setBankOpen(false)}>Cancel</button>
              <button type="submit" form="bank-form" disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>
                {busy ? "Saving..." : "Save details"}
              </button>
            </>
          }
        >
          <form id="bank-form" onSubmit={saveBank} className="space-y-4">
            <Field label="Bank name">
              <input className={inputCls} required maxLength={100} value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} />
            </Field>
            <Field label="Account name">
              <input className={inputCls} required maxLength={150} value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} />
            </Field>
            <Field label="Account number">
              <input className={inputCls} required inputMode="numeric" maxLength={40} value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
            </Field>
            <Field label="Branch (optional)">
              <input className={inputCls} maxLength={100} value={bankForm.branch} onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })} />
            </Field>
            {bankError && <p className="text-sm text-danger">{bankError}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}