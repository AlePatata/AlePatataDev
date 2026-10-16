import { Download } from 'lucide-react';
import { about, curriculum } from '../data/data';
import type { CvEntry } from '../types';

function CvSection({ title, entries }: { title: string; entries: CvEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div>
      <h4 className="text-lg font-semibold text-rose-900 mb-3 pb-2 border-b border-pink-100">
        {title}
      </h4>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={`${entry.title}-${entry.place}`} className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-pink-400 mt-2 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-rose-900">{entry.title}</h5>
              <p className="text-pink-500 text-sm">{entry.place} · {entry.period}</p>
              {entry.description && (
                <p className="text-rose-700 text-sm mt-1">{entry.description}</p>
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
        <h2 className="text-3xl md:text-4xl font-bold text-rose-900 mb-2">Curriculum</h2>
        <div className="w-20 h-1 bg-pink-400 mb-10 rounded-full" />

        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-8 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-rose-900 mb-1">{about.name}</h3>
              <p className="text-pink-500 font-medium">{about.role}</p>
            </div>
            {curriculum.cvUrl && (
              <a
                href={curriculum.cvUrl}
                download
                className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors"
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
              <h4 className="text-lg font-semibold text-rose-900 mb-3 pb-2 border-b border-pink-100">
                Habilidades
              </h4>
              <div className="flex flex-wrap gap-2">
                {curriculum.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-pink-100 text-pink-600 rounded-full text-sm">
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
