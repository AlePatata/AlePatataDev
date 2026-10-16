import { ArrowUpRight } from 'lucide-react';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-line-soft flex flex-col">
      <div className="relative overflow-hidden h-48">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-glow-from to-glow-to flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <span className="text-7xl">{project.emoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-shade/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-ink">{project.title}</h3>
          <span className="text-xs text-ink-faint">{project.year}</span>
        </div>
        <p className="text-ink-muted text-sm mb-4">{project.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-soft text-accent-strong text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1 text-accent hover:text-accent-hover font-medium text-sm transition-colors"
        >
          Ver en GitHub <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  );
}
