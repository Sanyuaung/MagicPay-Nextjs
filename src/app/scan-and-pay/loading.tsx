export default function Loading() {
  return (
    <div className="route-skeleton" role="status" aria-live="polite">
      <div className="route-skeleton-shell">
        <div className="route-skeleton-card">
          <div className="route-skeleton-box" />
          <div className="route-skeleton-line w-70" />
          <div className="route-skeleton-line w-60 no-margin" />
        </div>

        <div className="route-skeleton-card">
          <div className="route-skeleton-line w-90" />
          <div className="route-skeleton-line w-80 no-margin" />
        </div>
      </div>
    </div>
  );
}
