import { Layout } from '../components/Layout';
import { about } from '../data/data';
import { MapPin, Mail } from 'lucide-react';
import { BsGithub, BsLinkedin } from "react-icons/bs";

export function Home() {
  return (
    <Layout>
      <section className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <div className="mb-6 inline-block px-4 py-1.5 bg-pink-100 text-pink-600 rounded-full text-sm font-medium">
            Hola, soy
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-rose-900 mb-4">
            {about.name}
          </h1>
          <p className="text-xl md:text-2xl text-pink-500 font-medium mb-6">
            {about.role}
          </p>
          <p className="text-rose-800 mb-8 leading-relaxed">
            {about.bio}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-rose-900 mb-8">
            <span className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-pink-500" />
              {about.location}
            </span>
            <span className="flex items-center gap-2 text-sm">
              <Mail size={16} className="text-pink-500" />
              {about.email}
            </span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <a
              href={about.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
            >
              <BsGithub size={18} />
              GitHub
            </a>
            <a
              href={about.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-rose-900 border border-pink-200 rounded-full font-medium hover:bg-pink-50 transition-colors"
            >
              <BsLinkedin size={18} />
              LinkedIn
            </a>
          </div>
        </div>
      </section>
      
    </Layout>
  );
}