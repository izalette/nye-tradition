"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CreateEventForm } from "./admin-forms";

export function AdminCreateEventModal({ baseUrl }: { baseUrl: string }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleSuccess = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current;
    el?.showModal();
    return () => {
      el?.close();
    };
  }, [open]);

  const handleOpen = () => {
    setSession((s) => s + 1);
    setOpen(true);
  };

  return (
    <>
      <button type="button" className="btn admin-toolbar-create-btn" onClick={handleOpen}>
        Create an event
      </button>
      {open ? (
        <dialog
          ref={dialogRef}
          className="admin-modal-dialog"
          onClose={() => setOpen(false)}
          aria-labelledby="admin-create-event-dialog-title"
        >
          <div className="admin-modal-inner">
            <header className="admin-modal-header">
              <h3 id="admin-create-event-dialog-title" className="admin-modal-title">
                Create an event
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <span aria-hidden>×</span>
              </button>
            </header>
            <CreateEventForm
              key={session}
              baseUrl={baseUrl}
              embedded
              modal
              onSuccess={handleSuccess}
            />
          </div>
        </dialog>
      ) : null}
    </>
  );
}
