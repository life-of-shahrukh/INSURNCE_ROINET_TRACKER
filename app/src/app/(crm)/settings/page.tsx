"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

interface SettingsSection {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly icon: string;
  readonly role?: string;
}

const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  {
    title: "My Profile",
    description: "View and manage your account details, role, and contact info",
    href: "/profile",
    icon: "◎",
  },
  {
    title: "Payout Grid Configuration",
    description: "Control which roles and POSPs can view payout grids",
    href: "/settings/payout-config",
    icon: "▥",
    role: "SUPER_ADMIN",
  },
];

export default function SettingsPage(): React.ReactElement {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleSections = SETTINGS_SECTIONS.filter(
    (s) => !s.role || user?.role === s.role,
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Please upload an Excel file (.xlsx or .xls)");
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/payout-grids/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { message?: string }).message || "Upload failed",
          );
        }

        toast.success("Payout grid file uploaded and processed successfully!");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [],
  );

  return (
    <div className="list-page">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile and system configuration"
      />

      <div className="settings-grid">
        {visibleSections.map((s) => (
          <Link key={s.href} href={s.href} className="settings-link">
            <div className="settings-item">
              <div className="settings-item__icon">{s.icon}</div>
              <div className="settings-item__body">
                <div className="settings-item__title">{s.title}</div>
                <div className="settings-item__desc">{s.description}</div>
              </div>
              <div className="settings-item__chevron">›</div>
            </div>
          </Link>
        ))}
      </div>

      {user?.role === "SUPER_ADMIN" && (
        <div className="settings-upload-card">
          <div className="settings-upload-card__accent" />
          <div className="settings-upload-card__body">
            <div className="settings-upload-card__info">
              <div className="settings-upload-card__icon">⬆</div>
              <div>
                <div className="settings-upload-card__title">
                  Upload Payout Grid Excel
                </div>
                <div className="settings-upload-card__desc">
                  Replace all insurer grid data by uploading a new Excel file.
                  Each sheet maps to one insurer.
                </div>
              </div>
            </div>
            <button
              className="btn"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Processing…" : "Choose File (.xlsx)"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
              hidden
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 0;
          background: var(--card);
          border-radius: 10px;
          box-shadow: var(--shadow);
          overflow: hidden;
          margin-bottom: 24px;
        }
        .settings-link {
          text-decoration: none;
          color: inherit;
        }
        .settings-link:not(:last-child) .settings-item {
          border-bottom: 1px solid var(--border);
        }
        .settings-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          transition: background 0.15s;
          cursor: pointer;
        }
        .settings-item:hover {
          background: var(--bg);
        }
        .settings-item__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(15, 76, 117, 0.06);
          color: var(--primary);
          font-size: 18px;
          flex-shrink: 0;
        }
        .settings-item__body {
          flex: 1;
          min-width: 0;
        }
        .settings-item__title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          line-height: 1.3;
        }
        .settings-item__desc {
          font-size: 12.5px;
          color: var(--text-muted);
          margin-top: 2px;
          line-height: 1.4;
        }
        .settings-item__chevron {
          font-size: 20px;
          color: var(--text-muted);
          flex-shrink: 0;
          opacity: 0.5;
          transition: transform 0.15s, opacity 0.15s;
        }
        .settings-item:hover .settings-item__chevron {
          opacity: 1;
          transform: translateX(2px);
        }

        .settings-upload-card {
          background: var(--card);
          border-radius: 10px;
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .settings-upload-card__accent {
          height: 3px;
          background: linear-gradient(
            90deg,
            var(--primary) 0%,
            var(--primary-light) 55%,
            #5ba3d9 100%
          );
        }
        .settings-upload-card__body {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .settings-upload-card__info {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }
        .settings-upload-card__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: var(--bg);
          border: 1px solid var(--border);
          font-size: 18px;
          flex-shrink: 0;
        }
        .settings-upload-card__title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          line-height: 1.3;
        }
        .settings-upload-card__desc {
          font-size: 12.5px;
          color: var(--text-muted);
          margin-top: 2px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
