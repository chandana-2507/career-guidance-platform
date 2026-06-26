export function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="card text-center">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 text-sm font-medium underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse space-y-3">
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      <div className="h-3 w-full rounded bg-slate-200" />
      <div className="h-3 w-2/3 rounded bg-slate-200" />
    </div>
  );
}
