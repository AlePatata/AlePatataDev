import { Menu, X } from 'lucide-react';
import { BsGithub, BsLinkedin } from "react-icons/bs";
import { useState } from 'react';
import { about } from '../data/data';
import { ThemeToggle } from './ThemeToggle';

const navLinks = [
  { href: '#sobre-mi', label: 'Sobre mí' },
  { href: '#proyectos', label: 'Proyectos' },
  { href: '#curriculum', label: 'Curriculum' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bar/80 backdrop-blur-md border-b border-line">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="#" className="text-xl font-bold text-accent">
          &lt;div&gt;
        </a>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-ink hover:text-accent transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-3 ml-4 border-l border-line pl-4">
            <a href={about.github} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-accent">
              <BsGithub size={20} />
            </a>
            <a href={about.linkedin} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-accent">
              <BsLinkedin size={20} />
            </a>
          </div>
          <a href="/app" className="text-sm text-ink-faint hover:text-accent transition-colors">
            Entrar
          </a>
          <ThemeToggle />
        </div>

        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            className="p-2 text-ink"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-bar border-t border-line px-4 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-ink hover:text-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-4 pt-2 border-t border-line">
            <a href={about.github} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-accent">
              <BsGithub size={20} />
            </a>
            <a href={about.linkedin} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-accent">
              <BsLinkedin size={20} />
            </a>
          </div>
          <a href="/app" className="text-sm text-ink-faint hover:text-accent transition-colors">
            Entrar
          </a>
        </div>
      )}
    </nav>
  );
}