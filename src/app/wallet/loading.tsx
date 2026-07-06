export default function Loading() {
  return (
    <div className="route-skeleton" role="status" aria-live="polite">
      <div className="route-skeleton-shell">
        <div className="route-skeleton-card">
          <div className="route-skeleton-row">
            <div className="route-skeleton-avatar" />
            <div className="route-skeleton-col">
              <div className="route-skeleton-line w-60" />
              <div className="route-skeleton-line w-40" />
              <div className="route-skeleton-line w-70 no-margin" />
            </div>
          </div>
          <div style={{ height: 12 }} />
          <div className="route-skeleton-line w-90" />
          <div className="route-skeleton-line w-70 no-margin" />
        </div>
      </div>
    </div>
  );
}
