"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/skeletons";
import {
  fetchAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type Announcement,
  type CreateAnnouncementInput,
  type AnnouncementSeverity,
} from "@/lib/api/announcement-api";
import {
  parseAnnouncementBoolean,
  resolveAnnouncementLifecycleStatus,
  type AnnouncementLifecycleStatus,
} from "@/lib/announcement-status";

const ALL_ROLES = [
  "SUPER_ADMIN",
  "NATIONAL_HEAD",
  "ZH",
  "RH",
  "ASM",
  "DM",
  "POSP",
] as const;

const SEVERITY_OPTIONS: { value: AnnouncementSeverity; label: string; color: string }[] = [
  { value: "info", label: "Info", color: "#3282b8" },
  { value: "warning", label: "Warning", color: "#f4a261" },
  { value: "success", label: "Success", color: "#2a9d8f" },
  { value: "error", label: "Error", color: "#e63946" },
];

function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowLocalInput(): string {
  return toLocalDatetimeInput(new Date().toISOString());
}

interface FormState {
  title: string;
  content: string;
  targetRoles: string[];
  severity: AnnouncementSeverity;
  priority: number;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  content: "",
  targetRoles: [...ALL_ROLES], // Default to all roles selected
  severity: "info",
  priority: 0,
  isActive: true,
  startsAt: nowLocalInput(),
  expiresAt: "",
};

function announcementToForm(a: Announcement): FormState {
  return {
    title: a.title,
    content: a.content,
    targetRoles: a.targetRoles.split(",").map((r) => r.trim()).filter(Boolean),
    severity: a.severity as AnnouncementSeverity,
    priority: a.priority,
    isActive: parseAnnouncementBoolean(a.isActive),
    startsAt: toLocalDatetimeInput(a.startsAt),
    expiresAt: a.expiresAt ? toLocalDatetimeInput(a.expiresAt) : "",
  };
}

function formToPayload(form: FormState): CreateAnnouncementInput {
  return {
    title: form.title.trim(),
    content: form.content.trim(),
    targetRoles: form.targetRoles.join(","),
    severity: form.severity,
    priority: form.priority,
    isActive: form.isActive,
    startsAt: new Date(form.startsAt).toISOString(),
    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
  };
}

function AnnouncementFormModal({
  editing,
  onClose,
}: {
  editing: Announcement | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(
    editing ? announcementToForm(editing) : { ...EMPTY_FORM, startsAt: nowLocalInput() }
  );
  const [submitting, setSubmitting] = useState(false);

  const toggleRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.content.trim()) { toast.error("Content is required"); return; }
    if (form.targetRoles.length === 0) { toast.error("Select at least one target role"); return; }
    if (!form.startsAt) { toast.error("Start date is required"); return; }

    setSubmitting(true);
    try {
      const payload = formToPayload(form);
      if (editing) {
        await updateAnnouncement(editing.id, payload);
        toast.success("Announcement updated");
      } else {
        await createAnnouncement(payload);
        toast.success("Announcement created");
      }
      await qc.invalidateQueries({ queryKey: ["announcements"] });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ann-modal-backdrop" onClick={onClose}>
      <div className="ann-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ann-modal__header">
          <div>
            <h2 className="ann-modal__title">{editing ? "Edit Announcement" : "New Announcement"}</h2>
            <p className="ann-modal__subtitle">
              {editing ? "Update the announcement details below" : "Create a banner message visible to selected roles"}
            </p>
          </div>
          <button type="button" className="ann-modal__close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form className="ann-modal__body" onSubmit={handleSubmit}>
          <div className="ann-form-section">
            <div className="ann-form-group">
              <label className="ann-label">
                Title <span className="ann-label__required">*</span>
              </label>
              <input
                className="ann-input"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                maxLength={200}
                placeholder="e.g. System maintenance scheduled"
              />
            </div>

            <div className="ann-form-group">
              <label className="ann-label">
                Message <span className="ann-label__required">*</span>
              </label>
              <textarea
                className="ann-input ann-textarea"
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={3}
                maxLength={2000}
                placeholder="Write the announcement message that users will see..."
              />
              <span className="ann-char-count">{form.content.length}/2000</span>
            </div>
          </div>

          <div className="ann-form-section">
            <label className="ann-label">
              Target Roles <span className="ann-label__required">*</span>
            </label>
            <p className="ann-helper-text">Select which roles will see this announcement</p>
            <div className="ann-role-grid">
              {ALL_ROLES.map((role) => {
                const isSelected = form.targetRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    className={`ann-role-chip ${isSelected ? "ann-role-chip--selected" : ""}`}
                    onClick={() => toggleRole(role)}
                  >
                    <span className="ann-role-chip__check">
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </span>
                    {role.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ann-form-section">
            <div className="ann-form-row">
              <div className="ann-form-group ann-form-group--flex">
                <label className="ann-label">Severity</label>
                <p className="ann-helper-text">Visual style of the announcement banner</p>
                <div className="ann-severity-options">
                  {SEVERITY_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      className={`ann-severity-btn ${form.severity === s.value ? "ann-severity-btn--selected" : ""}`}
                      onClick={() => setForm((p) => ({ ...p, severity: s.value }))}
                      style={{
                        "--severity-color": s.color,
                        "--severity-bg": s.color + "18",
                      } as React.CSSProperties}
                    >
                      <span className="ann-severity-btn__dot" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="ann-form-section">
            <div className="ann-form-row">
              <div className="ann-form-group">
                <label className="ann-label">
                  Starts At <span className="ann-label__required">*</span>
                </label>
                <input
                  type="datetime-local"
                  className="ann-input"
                  value={form.startsAt}
                  onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
                />
              </div>
              <div className="ann-form-group">
                <label className="ann-label">Expires At</label>
                <input
                  type="datetime-local"
                  className="ann-input"
                  value={form.expiresAt}
                  onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                />
                <span className="ann-helper-text">Leave empty for no expiry</span>
              </div>
            </div>
          </div>

          <div className="ann-form-section ann-form-section--inline">
            <label className="ann-toggle">
              <input
                type="checkbox"
                className="ann-toggle__input"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              <span className="ann-toggle__track">
                <span className="ann-toggle__thumb" />
              </span>
              <span className="ann-toggle__label">
                Enabled
                <span className="ann-toggle__hint">
                  When off, the announcement is hidden regardless of schedule
                </span>
              </span>
            </label>
          </div>

          <div className="ann-modal__footer">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save Changes" : "Create Announcement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const opt = SEVERITY_OPTIONS.find((s) => s.value === severity) ?? SEVERITY_OPTIONS[0];
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        background: opt.color + "22",
        color: opt.color,
        border: `1px solid ${opt.color}44`,
        textTransform: "capitalize",
      }}
    >
      {severity}
    </span>
  );
}

const LIFECYCLE_STATUS_STYLES: Record<
  AnnouncementLifecycleStatus,
  { label: string; background: string; color: string; border: string }
> = {
  live: {
    label: "Live",
    background: "#2a9d8f22",
    color: "#2a9d8f",
    border: "#2a9d8f44",
  },
  scheduled: {
    label: "Scheduled",
    background: "#3282b822",
    color: "#3282b8",
    border: "#3282b844",
  },
  expired: {
    label: "Expired",
    background: "#6b728022",
    color: "#6b7280",
    border: "#6b728044",
  },
  inactive: {
    label: "Inactive",
    background: "#e6394622",
    color: "#e63946",
    border: "#e6394644",
  },
};

function StatusBadge({ announcement }: { announcement: Announcement }) {
  const status = resolveAnnouncementLifecycleStatus(announcement);
  const style = LIFECYCLE_STATUS_STYLES[status];
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {style.label}
    </span>
  );
}

export default function AnnouncementsPage(): React.ReactElement {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const { data: result, isLoading } = useQuery({
    queryKey: ["announcements", page],
    queryFn: () => fetchAllAnnouncements(page, 20),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: async () => {
      toast.success("Announcement deleted");
      await qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAnnouncement(id, { isActive }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const announcements = result?.data ?? [];
  const meta = result?.meta;

  function handleEdit(a: Announcement) {
    setEditing(a);
    setModalOpen(true);
  }

  function handleNew() {
    setEditing(null);
    setModalOpen(true);
  }

  async function handleDelete(a: Announcement) {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(a.id);
  }

  function handleToggleActive(a: Announcement) {
    const isEnabled = parseAnnouncementBoolean(a.isActive);
    toggleActiveMutation.mutate({ id: a.id, isActive: !isEnabled });
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Broadcast banner messages to specific roles across the CRM"
        actions={
          <Button onClick={handleNew}>+ New Announcement</Button>
        }
      />

      <Card>
        {isLoading ? (
          <TableSkeleton columns={6} rows={5} />
        ) : announcements.length === 0 ? (
          <div className="ann-empty-state">
            <div className="ann-empty-state__icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M4 16h40M16 24h16M16 30h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="ann-empty-state__title">No announcements yet</h3>
            <p className="ann-empty-state__text">Create your first announcement to broadcast messages across the CRM</p>
            <Button onClick={handleNew}>+ Create Announcement</Button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Announcement</th>
                  <th>Target Roles</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Schedule</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => {
                  const isEnabled = parseAnnouncementBoolean(a.isActive);
                  return (
                  <tr key={a.id}>
                    <td style={{ maxWidth: 280 }}>
                      <div className="ann-table-title">{a.title}</div>
                      <div className="ann-table-excerpt">{a.content}</div>
                    </td>
                    <td>
                      <div className="ann-table-roles">
                        {a.targetRoles.split(",").map((r) => (
                          <span key={r.trim()} className="ann-table-role-tag">
                            {r.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td><SeverityBadge severity={a.severity} /></td>
                    <td><StatusBadge announcement={a} /></td>
                    <td>
                      <div className="ann-table-schedule">
                        <span className="ann-table-date">
                          {new Date(a.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                        {a.expiresAt && (
                          <span className="ann-table-expires">
                            → {new Date(a.expiresAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="ann-table-actions">
                        <button
                          type="button"
                          className="ann-action-btn ann-action-btn--edit"
                          onClick={() => handleEdit(a)}
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.08 1.92a1.5 1.5 0 012.12 2.12L5.13 11.1l-2.8.7.7-2.8 7.05-7.06z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`ann-action-btn ${isEnabled ? "ann-action-btn--deactivate" : "ann-action-btn--activate"}`}
                          onClick={() => handleToggleActive(a)}
                          title={isEnabled ? "Deactivate" : "Activate"}
                        >
                          {isEnabled ? (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7a6 6 0 1112 0A6 6 0 011 7z" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7a6 6 0 1112 0A6 6 0 011 7z" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7l2 2 2.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                          {isEnabled ? "Off" : "On"}
                        </button>
                        <button
                          type="button"
                          className="ann-action-btn ann-action-btn--delete"
                          onClick={() => handleDelete(a)}
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M5.5 4V2.5h3V4M3.5 4v7.5a1 1 0 001 1h5a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "12px 0" }}>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ‹ Prev
            </Button>
            <span style={{ lineHeight: "34px", fontSize: 13, color: "#666" }}>
              Page {page} of {meta.totalPages}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
            >
              Next ›
            </Button>
          </div>
        )}
      </Card>

      {modalOpen && (
        <AnnouncementFormModal
          editing={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
