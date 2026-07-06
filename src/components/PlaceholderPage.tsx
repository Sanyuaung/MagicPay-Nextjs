export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-start justify-center gap-4 px-6 py-20">
      <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700">Magic Pay Next Migration</p>
      <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
      <p className="max-w-2xl text-slate-600">{description}</p>
    </main>
  );
}
