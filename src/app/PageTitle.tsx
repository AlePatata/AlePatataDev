export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="text-3xl font-bold text-rose-900 mb-2">{children}</h1>
      <div className="w-20 h-1 bg-pink-400 mb-8 rounded-full" />
    </>
  );
}
