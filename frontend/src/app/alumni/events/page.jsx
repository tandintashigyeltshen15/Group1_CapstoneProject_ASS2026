"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { useStore, update, nextId, addNotification, formatDateTime } from "@/lib/store";
import { PageHeader, Card, Badge, EmptyState, Notice, btnPrimary, btnOutline } from "@/components/ui";

export default function EventsPage() {
  const [events] = useStore("events");
  const [registrations] = useStore("registrations");
  const [message, setMessage] = useState("");

  const isRegistered = (id) => registrations.some((r) => r.eventId === id);
  const isPast = (e) => e.status === "Completed" || new Date(e.dateTime) < new Date();

  function register(ev) {
    // Duplicate check (matches UNIQUE (UserID, EventID) in Event_Registration)
    if (isRegistered(ev.id)) return;
    update("registrations", (list) =>
      list.some((r) => r.eventId === ev.id)
        ? list
        : [...list, { id: nextId(list), eventId: ev.id, registrationDate: new Date().toISOString() }]
    );
    addNotification("Event", `You registered for ${ev.title}.`);
    setMessage(`You are registered for ${ev.title}.`);
  }

  function cancel(ev) {
    update("registrations", (list) => list.filter((r) => r.eventId !== ev.id));
    addNotification("Event", `You cancelled your registration for ${ev.title}.`);
    setMessage(`Registration cancelled for ${ev.title}.`);
  }

  const sorted = [...events].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  return (
    <div>
      <PageHeader title="Events" subtitle="Browse upcoming CST events and register." />
      {message && <Notice>{message}</Notice>}

      {sorted.length === 0 ? (
        <Card><EmptyState message="No events available." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((e) => {
            const registered = isRegistered(e.id);
            const closed = isPast(e) || e.status === "Cancelled";
            return (
              <Card key={e.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-sidebar">{e.title}</h3>
                  {e.status === "Cancelled" ? <Badge tone="red">Cancelled</Badge>
                    : isPast(e) ? <Badge>Completed</Badge>
                    : registered ? <Badge tone="green">Registered</Badge>
                    : <Badge tone="blue">Open</Badge>}
                </div>
                <p className="mt-2 text-sm text-text">{e.description}</p>
                <div className="mt-3 space-y-1 text-xs text-muted">
                  <p className="flex items-center gap-1"><CalendarDays size={12} /> {formatDateTime(e.dateTime)}</p>
                  <p className="flex items-center gap-1"><Clock size={12} /> {e.duration}</p>
                  <p className="flex items-center gap-1"><MapPin size={12} /> {e.venue}</p>
                </div>
                <div className="mt-4">
                  {closed ? (
                    <button disabled className={btnOutline + " opacity-50"}>Registration closed</button>
                  ) : registered ? (
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                        <CheckCircle2 size={16} /> Registered
                      </span>
                      <button onClick={() => cancel(e)} className="text-sm text-danger hover:underline">
                        Cancel registration
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => register(e)} className={btnPrimary}>Register</button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
