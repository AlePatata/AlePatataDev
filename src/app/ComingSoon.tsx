interface ComingSoonProps {
  title: string;
  children?: React.ReactNode;
}

export function ComingSoon({ title, children }: ComingSoonProps) {
  return (
    <section className="max-w-4xl">
      <h1 className="text-3xl font-bold text-ink mb-2">{title}</h1>
      <div className="w-20 h-1 bg-mark mb-8 rounded-full" />
      <div className="bg-card rounded-2xl border border-line-soft shadow-sm p-6 space-y-2">
        <p className="text-ink-soft">Próximamente.</p>
        {children}
      </div>
    </section>
  );
}
