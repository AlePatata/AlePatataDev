export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="text-3xl font-bold text-ink mb-2">{children}</h1>
      <div className="w-20 h-1 bg-mark mb-8 rounded-full" />
    </>
  );
}
