import { Layout } from '../components/Layout';
import { about } from '../data/data';
import { MapPin, Mail } from 'lucide-react';
import { BsGithub, BsLinkedin } from "react-icons/bs";

export function About() {
  return (
    <Layout>
      <section id="sobre-mi" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-rose-900 mb-2">Sobre mí</h2>
          <div className="w-20 h-1 bg-pink-400 mb-10 rounded-full" />

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="bg-gradient-to-br from-pink-200 to-pink-100 rounded-2xl aspect-square max-w-sm mx-auto flex items-center justify-center">
                <span className="text-8xl">👩‍💻</span>
              </div>
            </div>
            <div>
              <p className="text-rose-800 mb-6 leading-relaxed">
                {about.bio}
              </p>
              <p className="text-rose-800 mb-6 leading-relaxed">
                {about.hobbies}
              </p>
              <div className="space-y-3 text-rose-900">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-pink-500" />
                  <span>{about.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-pink-500" />
                  <span>{about.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <BsGithub size={18} className="text-pink-500" />
                  <a href={about.github} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
                    {about.github.replace('https://', '')}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <BsLinkedin size={18} className="text-pink-500" />
                  <a href={about.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
                    {about.linkedin.replace('https://', '')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}