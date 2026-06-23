interface TrashIconButtonProps {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  className?: string;
}

export function TrashIconButton({
  onClick,
  title = "Delete",
  disabled = false,
  className = "",
}: TrashIconButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn--trash danger ${className}`.trim()}
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M2.5 4h9M5.5 4V2.5h3V4M3.5 4v7.5a1 1 0 001 1h5a1 1 0 001-1V4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
