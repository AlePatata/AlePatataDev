import { Footer } from '../components/Footer';
import { Layout } from '../components/Layout';
import { Download } from 'lucide-react';

export function Curriculum() {
  return (
    <Layout>
      <section id="curriculum" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-rose-900 mb-2">Curriculum</h2>
          <div className="w-20 h-1 bg-pink-400 mb-10 rounded-full" />

          <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-8 mb-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-rose-900 mb-1">Tu Nombre</h3>
                <p className="text-pink-500 font-medium">Desarrollador Full Stack</p>
              </div>
              <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors"
              >
                <Download size={18} />
                Descargar CV
              </a>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="text-lg font-semibold text-rose-900 mb-3 pb-2 border-b border-pink-100">
                  Experiencia Profesional
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-pink-400 mt-2 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-rose-900">Desarrollador Frontend</h5>
                      <p className="text-pink-500 text-sm">Empresa ABC · 2022 - Presente</p>
                      <p className="text-rose-700 text-sm mt-1">
                        Desarrollo de aplicaciones web con React y TypeScript.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-pink-400 mt-2 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-rose-900">Desarrollador Junior</h5>
                      <p className="text-pink-500 text-sm">Startup XYZ · 2020 - 2022</p>
                      <p className="text-rose-700 text-sm mt-1">
                        Mantenimiento y desarrollo de nuevas funcionalidades.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-rose-900 mb-3 pb-2 border-b border-pink-100">
                  Educación
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-pink-400 mt-2 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-rose-900">Licenciatura en Sistemas</h5>
                      <p className="text-pink-500 text-sm">Universidad Nacional · 2016 - 2020</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-rose-900 mb-3 pb-2 border-b border-pink-100">
                  Habilidades
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML/CSS', 'Git', 'PostgreSQL', 'MongoDB'].map((skill) => (
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
      <Footer />
    </Layout>
  );
}