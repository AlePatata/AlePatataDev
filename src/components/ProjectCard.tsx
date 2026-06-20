import { ArrowUpRight } from 'lucide-react';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-pink-100">
      <div className="relative overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-rose-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-rose-900 mb-2">{project.title}</h3>
        <p className="text-rose-700 text-sm mb-4 line-clamp-2">{project.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-pink-100 text-pink-600 text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <a
          href={project.link}
          className="inline-flex items-center gap-1 text-pink-500 hover:text-pink-600 font-medium text-sm transition-colors"
        >
          Ver proyecto <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  );
}