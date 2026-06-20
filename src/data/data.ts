import type { Project } from '../types/index';

export const projects: Project[] = [
  {
    id: '1',
    title: 'E-commerce Dashboard',
    description: 'Panel de administración para tienda online con estadísticas de ventas y gestión de productos.',
    image: 'https://picsum.photos/seed/proj1/600/400',
    link: '#',
    tags: ['React', 'TypeScript', 'Node.js']
  },
  {
    id: '2',
    title: 'Task Manager App',
    description: 'Aplicación de gestión de tareas con colaboración en tiempo real y tableros kanban.',
    image: 'https://picsum.photos/seed/proj2/600/400',
    link: '#',
    tags: ['React', 'Firebase', 'Tailwind']
  },
  {
    id: '3',
    title: 'Weather API Client',
    description: 'Cliente web para consulta del clima con geolocalización y pronosticos extendidos.',
    image: 'https://picsum.photos/seed/proj3/600/400',
    link: '#',
    tags: ['JavaScript', 'API REST', 'CSS']
  }
];

export const about = {
  name: 'Alejandra Campos Urbina',
  role: 'Ingeniera Civil en Computación',
  bio: 'Actualmente en 5to año de la carrera, con experiencia en desarrollo web y móvil, programación competitiva y trabajo en equipo.',
  hobbies: 'Me gusta resolver problemas con algoritmos y técnicas de programación. \
    Amo jugar juegos de mesa, dibujar y ver películas. \
    Sé tocar piano y me encanta la banda chilena Los Jaivas, de los que aprendí todo lo que sé de música. \
  ',
  location: 'Santiago, Chile',
  email: 'ale.campos.urbina@gmail.com',
  github: 'https://github.com/AlePatata',
  linkedin: 'https://linkedin.com/in/alejandra-campos-urbina'
};