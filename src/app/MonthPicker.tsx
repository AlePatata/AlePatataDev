import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel, shiftMonth } from './months';

export function MonthPicker({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white rounded-full border border-pink-100 px-1">
      <button aria-label="Mes anterior" onClick={() => onChange(shiftMonth(month, -1))} className="p-2 text-rose-700 hover:text-pink-500">
        <ChevronLeft size={18} />
      </button>
      <span className="w-44 text-center text-rose-900 font-medium whitespace-nowrap">{monthLabel(month)}</span>
      <button aria-label="Mes siguiente" onClick={() => onChange(shiftMonth(month, 1))} className="p-2 text-rose-700 hover:text-pink-500">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
