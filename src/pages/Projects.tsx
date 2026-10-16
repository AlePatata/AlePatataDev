import { ProjectCard } from '../components/ProjectCard';
import { projects } from '../data/data';

export function Projects() {
  return (
    <section id="proyectos" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-rose-900 mb-2">Proyectos</h2>
        <div className="w-20 h-1 bg-pink-400 mb-10 rounded-full" />
        <p className="text-rose-800 mb-12 max-w-2xl">
          Algunos proyectos de la universidad y personales: robótica, videojuegos, diseño de software y ciencia de datos.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}