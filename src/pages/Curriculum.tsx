import { Download } from 'lucide-react';
import { about, curriculum } from '../data/data';
import type { CvEntry } from '../types';

function CvSection({ title, entries }: { title: string; entries: CvEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div>
      <h4 className="text-lg font-semibold text-ink mb-3 pb-2 border-b border-line-soft">
        {title}
      </h4>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={`${entry.title}-${entry.place}`} className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-mark mt-2 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-ink">{entry.title}</h5>
              <p className="text-accent text-sm">{entry.place} · {entry.period}</p>
              {entry.description && (
                <p className="text-ink-muted text-sm mt-1">{entry.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Curriculum() {
  return (
    <section id="curriculum" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-2">Curriculum</h2>
        <div className="w-20 h-1 bg-mark mb-10 rounded-full" />

        <div className="bg-card rounded-2xl border border-line-soft shadow-sm p-8 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-ink mb-1">{about.name}</h3>
              <p className="text-accent font-medium">{about.role}</p>
            </div>
            {curriculum.cvUrl && (
              <a
                href={curriculum.cvUrl}
                download
                className="flex items-center gap-2 px-4 py-2 bg-accent text-on-accent rounded-lg font-medium hover:bg-accent-hover transition-colors"
              >
                <Download size={18} />
                Descargar CV
              </a>
            )}
          </div>

          <div className="space-y-8">
            <CvSection title="Experiencia" entries={curriculum.experience} />
            <CvSection title="Educación" entries={curriculum.education} />

            <div>
              <h4 className="text-lg font-semibold text-ink mb-3 pb-2 border-b border-line-soft">
                Habilidades
              </h4>
              <div className="flex flex-wrap gap-2">
                {curriculum.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-soft text-accent-strong rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
