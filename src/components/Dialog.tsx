import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { Icon } from "../Icon.tsx";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  id: string;
  titleId: string;
  eyebrow: string;
  closeLabel: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

// A native modal <dialog>: the browser handles Escape, focus trapping, and
// returning focus to the control that opened it.
export function Dialog(props: DialogProps) {
  const { open, onClose, id, titleId, eyebrow, closeLabel, title, subtitle, children } = props;
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();

    if (!open && dialog.open) dialog.close();
  }, [open]);

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return;
    const r = event.currentTarget.getBoundingClientRect();

    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      onClose();
  };

  return (
    <dialog ref={ref} id={id} aria-labelledby={titleId} onClose={onClose} onClick={closeOnBackdrop}>
      <div className="dialog-top">
        <span className="eyebrow">{eyebrow}</span>
        <button className="icon-button dialog-close" aria-label={closeLabel} onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <h2 id={titleId}>{title}</h2>
      <p className="dialog-subtitle">{subtitle}</p>
      {children}
    </dialog>
  );
}
