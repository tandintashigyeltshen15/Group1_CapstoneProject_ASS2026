"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle,
  Clock3,
  Eye,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { Badge, Card, EmptyState, Notice, PageHeader, inputCls } from "@/components/ui";
import { useStore, update, formatDateTime } from "@/lib/store";
import { Avatar, Modal, Table, btnSm, btnSmDanger, btnSmSuccess } from "@/components/AdminUI";

const STEPS = [
  { title: "Staff Registration", detail: "Staff submits their details and official CST email.", icon: UserPlus },
  { title: "Pending Verification", detail: "Account remains limited until reviewed.", icon: Clock3 },
  { title: "Administrator Review", detail: "Identity and employment are verified by an administrator.", icon: ShieldCheck },
  { title: "Approval / Rejection", detail: "Account is approved or rejected with a reason.", icon: CheckCircle },
  { title: "Access Granted", detail: "Approved staff can access staff features.", icon: UserCheck },
];

const statusTone = {
  "Pending Review": "orange",
  Approved: "green",
  Rejected: "red",
};

export default function AdminStaffVerificationPage() {
  const [requests] = useStore("adminStaffVerifications");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [flash, setFlash] = useState(null);

  const visibleRequests = useMemo(() => {
    const search = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = status === "all" || request.status === status;
      const matchesSearch =
        !search ||
        [request.name, request.email, request.department].some((value) =>
          value.toLowerCase().includes(search)
        );
      return matchesStatus && matchesSearch;
    });
  }, [requests, query, status]);

  const updateStatus = (request, nextStatus) => {
    update("adminStaffVerifications", (list) =>
      list.map((item) => (item.id === request.id ? { ...item, status: nextStatus } : item))
    );
    setSelected(null);
    setFlash({
      tone: nextStatus === "Approved" ? "green" : "red",
      text: `${request.name}'s staff registration was ${nextStatus.toLowerCase()}.`,
    });
  };

  return (
    <div>
      <PageHeader title="Staff Verification" />
      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

      <Card className="mb-5 border-blue-100 bg-blue-50/50">
        <div className="grid gap-6 lg:grid-cols-[minmax(220px,0.8fr)_2fr] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 className="font-semibold text-sidebar">Staff Verification</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Staff members must be verified by an authorized administrator before they can
                access staff-only features. This ensures that only genuine CST employees are
                granted access.
              </p>
            </div>
          </div>

          <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {STEPS.map(({ title, detail, icon: Icon }, index) => (
              <li key={title} className="relative min-w-0 text-center">
                {index > 0 && (
                  <ArrowRight
                    size={16}
                    className="absolute -left-3 top-4 hidden text-blue-400 xl:block"
                    aria-hidden="true"
                  />
                )}
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-primary">
                  <Icon size={18} />
                </span>
                <span className="mx-auto mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <p className="mt-2 text-xs font-semibold text-sidebar">{title}</p>
                <p className="mt-1 text-[11px] leading-4 text-muted">{detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </Card>

      <Card
        title="Pending Staff Verifications"
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
              placeholder="Search by name, email or department..."
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
          </select>
        </div>

        <Table
          head={["#", "Name", "Email", "Department", "Registration Date", "Status", "Action"]}
          empty={visibleRequests.length === 0 && <EmptyState message="No staff verification requests match your filters." />}
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
              <td className="px-3 py-3 text-text">{request.email}</td>
              <td className="px-3 py-3 text-text">{request.department}</td>
              <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDateTime(request.registeredAt)}</td>
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
                        onClick={() => updateStatus(request, "Approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={btnSmDanger}
                        onClick={() => updateStatus(request, "Rejected")}
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
        <p className="mt-3 text-xs text-muted">
          Showing {visibleRequests.length} of {requests.length} results
        </p>
      </Card>

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
                    onClick={() => updateStatus(selected, "Rejected")}
                  >
                    <X size={14} />
                    Reject
                  </button>
                  <button
                    type="button"
                    className={btnSmSuccess}
                    onClick={() => updateStatus(selected, "Approved")}
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
              <dt className="text-xs text-muted">Official CST email</dt>
              <dd className="text-sm font-medium text-sidebar">{selected.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Department</dt>
              <dd className="text-sm font-medium text-sidebar">{selected.department}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Registration date</dt>
              <dd className="text-sm font-medium text-sidebar">{formatDateTime(selected.registeredAt)}</dd>
            </div>
          </dl>
        </Modal>
      )}
    </div>
  );
}
