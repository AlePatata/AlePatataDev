interface ComingSoonProps {
  title: string;
  children?: React.ReactNode;
}

export function ComingSoon({ title, children }: ComingSoonProps) {
  return (
    <section className="max-w-4xl">
      <h1 className="text-3xl font-bold text-rose-900 mb-2">{title}</h1>
      <div className="w-20 h-1 bg-pink-400 mb-8 rounded-full" />
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6 space-y-2">
        <p className="text-rose-800">Próximamente.</p>
        {children}
      </div>
    </section>
  );
}
