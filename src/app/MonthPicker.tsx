import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel, shiftMonth } from './months';

export function MonthPicker({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  return (
    <div className="inline-flex items-center gap-1 bg-card rounded-full border border-line-soft px-1">
      <button aria-label="Mes anterior" onClick={() => onChange(shiftMonth(month, -1))} className="p-2 text-ink-muted hover:text-accent">
        <ChevronLeft size={18} />
      </button>
      <span className="w-44 text-center text-ink font-medium whitespace-nowrap">{monthLabel(month)}</span>
      <button aria-label="Mes siguiente" onClick={() => onChange(shiftMonth(month, 1))} className="p-2 text-ink-muted hover:text-accent">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
