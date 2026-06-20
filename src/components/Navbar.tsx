import { Menu, X } from 'lucide-react';
import { BsGithub, BsLinkedin } from "react-icons/bs";
import { useState } from 'react';

const navLinks = [
  { href: '#sobre-mi', label: 'Sobre mí' },
  { href: '#proyectos', label: 'Proyectos' },
  { href: '#curriculum', label: 'Curriculum' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-rose-50/80 backdrop-blur-md border-b border-pink-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="#" className="text-xl font-bold text-pink-500">
          &lt;div&gt;
        </a>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-rose-900 hover:text-pink-500 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-3 ml-4 border-l border-pink-200 pl-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-rose-900 hover:text-pink-500">
              <BsGithub size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-rose-900 hover:text-pink-500">
              <BsLinkedin size={20} />
            </a>
          </div>
        </div>

        <button className="md:hidden text-rose-900" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-rose-50 border-t border-pink-200 px-4 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-rose-900 hover:text-pink-500 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-4 pt-2 border-t border-pink-200">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-rose-900 hover:text-pink-500">
              <BsGithub size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-rose-900 hover:text-pink-500">
              <BsLinkedin size={20} />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}