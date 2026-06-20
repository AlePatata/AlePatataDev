import { Layout } from '../components/Layout';
import { ProjectCard } from '../components/ProjectCard';
import { projects } from '../data/data';

export function Projects() {
  return (
    <Layout>
      <section id="proyectos" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-rose-900 mb-2">Proyectos</h2>
          <div className="w-20 h-1 bg-pink-400 mb-10 rounded-full" />
          <p className="text-rose-800 mb-12 max-w-2xl">
            Una selección de proyectos en los que he trabajado. Cada uno representa un desafío único y una oportunidad para aprender algo nuevo.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}