import type { Category } from '../shared/summary';

export function CategoryChip({ category }: { category?: Category }) {
  if (!category) return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Sin categoría</span>;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-800">
      <span className="size-2 rounded-full" style={{ backgroundColor: category.color }} />
      {category.name}
    </span>
  );
}

const KIND_GROUPS: [Category['kind'], string][] = [
  ['expense', 'Gastos'],
  ['refund', 'Reembolsos'],
  ['income', 'Ingresos'],
];

export function CategorySelect({
  categories,
  value,
  onChange,
  className,
  emptyLabel = 'Sin categoría',
}: {
  categories: Category[];
  value: number | null;
  onChange: (id: number | null) => void;
  className?: string;
  emptyLabel?: string;
}) {
  return (
    <select
      aria-label="Categoría"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={className}
    >
      <option value="">{emptyLabel}</option>
      {KIND_GROUPS.map(([kind, label]) => (
        <optgroup key={kind} label={label}>
          {categories
            .filter((c) => c.kind === kind)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}
