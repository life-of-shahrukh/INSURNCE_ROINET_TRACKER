"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Omit for default Cancel; pass `null` to hide the footer */
  footer?: ReactNode | null;
  wide?: boolean;
}

export function Modal({ open, title, onClose, children, footer, wide = false }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className={`modal-overlay show`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal${wide ? " modal--wide" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer === null ? null : (
          <div className="modal-footer">
            {footer ?? (
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
