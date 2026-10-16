import { about } from '../data/data';
import { MapPin, Mail } from 'lucide-react';
import { BsGithub, BsLinkedin } from "react-icons/bs";

export function About() {
  return (
    <section id="sobre-mi" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-2">Sobre mí</h2>
        <div className="w-20 h-1 bg-mark mb-10 rounded-full" />

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="bg-gradient-to-br from-glow-from to-glow-to rounded-2xl aspect-square max-w-sm mx-auto flex items-center justify-center">
              <span className="text-8xl">👩‍💻</span>
            </div>
          </div>
          <div>
            <p className="text-ink-soft mb-6 leading-relaxed">
              {about.bio}
            </p>
            <p className="text-ink-soft mb-6 leading-relaxed">
              {about.hobbies}
            </p>
            <div className="space-y-3 text-ink">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-accent" />
                <span>{about.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-accent" />
                <span>{about.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <BsGithub size={18} className="text-accent" />
                <a href={about.github} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                  {about.github.replace('https://', '')}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <BsLinkedin size={18} className="text-accent" />
                <a href={about.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                  {about.linkedin.replace('https://', '')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}