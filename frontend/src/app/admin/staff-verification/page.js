"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, Search, ShieldCheck, X } from "lucide-react";
import { Badge, Card, EmptyState, Notice, PageHeader, inputCls } from "@/components/ui";
import { api } from "@/lib/api";
import { Avatar, Modal, Table, btnSm, btnSmDanger, btnSmSuccess } from "@/components/AdminUI";

const statusTone = {
  "Pending Review": "orange",
  Approved: "green",
  Suspended: "red",
  Rejected: "red",
};

export default function AdminStaffVerificationPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [flash, setFlash] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await api("/admin/staff"));
    } catch (err) {
      setFlash({ tone: "red", text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleRequests = useMemo(() => {
    const search = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = status === "all" || request.status === status;
      const matchesSearch =
        !search ||
        [request.name, request.email, request.department, request.employeeId].some((value) =>
          (value || "").toLowerCase().includes(search)
        );
      return matchesStatus && matchesSearch;
    });
  }, [requests, query, status]);

  const approve = async (request) => {
    setBusy(true);
    try {
      await api(`/admin/staff/${request.id}/approve`, { method: "POST" });
      setRequests((list) =>
        list.map((item) => (item.id === request.id ? { ...item, status: "Approved" } : item))
      );
      setSelected(null);
      setFlash({ tone: "green", text: `${request.name}'s staff registration was approved.` });
    } catch (err) {
      setFlash({ tone: "red", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const openReject = (request) => {
    setSelected(null);
    setReason("");
    setReasonError("");
    setRejecting(request);
  };

  const confirmReject = async () => {
    const text = reason.trim();
    if (text.length < 5) {
      setReasonError("Please give a reason of at least 5 characters.");
      return;
    }
    setBusy(true);
    try {
      await api(`/admin/staff/${rejecting.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: text }),
      });
      setRequests((list) =>
        list.map((item) =>
          item.id === rejecting.id ? { ...item, status: "Rejected", rejectionReason: text } : item
        )
      );
      setFlash({ tone: "red", text: `${rejecting.name}'s staff registration was rejected.` });
      setRejecting(null);
    } catch (err) {
      setReasonError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Staff Verification" />
      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

      <Card
        title="Staff Verifications"
        icon={ShieldCheck}
        action={<span className="text-sm text-muted">Review and approve or reject staff registration requests.</span>}
      >
        <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
          <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={`${inputCls} pl-9`}
              placeholder="Search by name, email, ID or department..."
              aria-label="Search staff verification requests"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={`${inputCls} !w-auto`}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <Table
          head={["#", "Name", "Employee ID", "Email", "Department", "Status", "Action"]}
          empty={
            !loading &&
            visibleRequests.length === 0 && (
              <EmptyState message="No staff verification requests match your filters." />
            )
          }
        >
          {visibleRequests.map((request, index) => (
            <tr key={request.id}>
              <td className="px-3 py-3 text-sidebar">{index + 1}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={request.name} size="h-8 w-8" />
                  <span className="whitespace-nowrap font-medium text-sidebar">{request.name}</span>
                </div>
              </td>
              <td className="px-3 py-3 text-text">{request.employeeId || "-"}</td>
              <td className="px-3 py-3 text-text">{request.email}</td>
              <td className="px-3 py-3 text-text">{request.department || "-"}</td>
              <td className="px-3 py-3">
                <Badge tone={statusTone[request.status] || "gray"}>{request.status}</Badge>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  {request.status === "Pending Review" && (
                    <>
                      <button
                        type="button"
                        className={btnSmSuccess}
                        disabled={busy}
                        onClick={() => approve(request)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={btnSmDanger}
                        disabled={busy}
                        onClick={() => openReject(request)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={btnSm}
                    onClick={() => setSelected(request)}
                    aria-label={`View ${request.name}'s registration`}
                  >
                    <Eye size={14} />
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
        {loading && <p className="mt-3 text-sm text-muted">Loading...</p>}
        <p className="mt-3 text-xs text-muted">
          Showing {visibleRequests.length} of {requests.length} results
        </p>
      </Card>

      {/* Details */}
      {selected && (
        <Modal
          title="Staff Registration Details"
          onClose={() => setSelected(null)}
          footer={
            <>
              <button type="button" className={btnSm} onClick={() => setSelected(null)}>
                Close
              </button>
              {selected.status === "Pending Review" && (
                <>
                  <button
                    type="button"
                    className={btnSmDanger}
                    disabled={busy}
                    onClick={() => openReject(selected)}
                  >
                    <X size={14} />
                    Reject
                  </button>
                  <button
                    type="button"
                    className={btnSmSuccess}
                    disabled={busy}
                    onClick={() => approve(selected)}
                  >
                    <Check size={14} />
                    Approve
                  </button>
                </>
              )}
            </>
          }
        >
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={selected.name} size="h-12 w-12" />
            <div>
              <p className="font-semibold text-sidebar">{selected.name}</p>
              <Badge tone={statusTone[selected.status] || "gray"}>{selected.status}</Badge>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">Employee ID</dt>
              <dd className="text-sm font-medium text-sidebar">{selected.employeeId || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Email</dt>
              <dd className="text-sm font-medium text-sidebar">{selected.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Department</dt>
              <dd className="text-sm font-medium text-sidebar">{selected.department || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Designation</dt>
              <dd className="text-sm font-medium text-sidebar">{selected.designation || "-"}</dd>
            </div>
            {selected.status === "Rejected" && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted">Reason for rejection</dt>
                <dd className="text-sm font-medium text-red-600">
                  {selected.rejectionReason || "-"}
                </dd>
              </div>
            )}
          </dl>
        </Modal>
      )}

      {/* Rejection reason */}
      {rejecting && (
        <Modal
          title="Reject Staff Registration"
          onClose={() => setRejecting(null)}
          footer={
            <>
              <button type="button" className={btnSm} onClick={() => setRejecting(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={btnSmDanger}
                disabled={busy}
                onClick={confirmReject}
              >
                <X size={14} />
                {busy ? "Rejecting..." : "Reject"}
              </button>
            </>
          }
        >
          <p className="mb-3 text-sm text-text">
            You are rejecting <span className="font-semibold">{rejecting.name}</span> (
            {rejecting.employeeId}). The reason is saved with the registration and shown to the
            person when they try to log in.
          </p>
          <label className="mb-1 block text-xs font-medium text-sidebar">
            Reason for rejection
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="e.g. Employee ID was not found in the CST staff list."
            className={inputCls}
          />
          <p className="mt-1 text-right text-xs text-muted">{reason.length}/500</p>
          {reasonError && <p className="mt-2 text-sm text-red-500">{reasonError}</p>}
        </Modal>
      )}
    </div>
  );
}