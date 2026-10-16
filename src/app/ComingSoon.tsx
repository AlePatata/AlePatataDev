import { PageTitle } from './PageTitle';

interface ComingSoonProps {
  title: string;
  children?: React.ReactNode;
}

export function ComingSoon({ title, children }: ComingSoonProps) {
  return (
    <section className="max-w-4xl">
      <PageTitle>{title}</PageTitle>
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6 space-y-2">
        <p className="text-rose-800">Próximamente.</p>
        {children}
      </div>
    </section>
  );
}
