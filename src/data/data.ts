import type { Curriculum, Hobby, Project } from '../types/index';

export const projects: Project[] = [
  {
    id: 'battlebot-montanna',
    title: 'BattleBot Montaña',
    description: 'Robot de combate "Ouros" construido en un equipo interdisciplinario FCFM + FAU: controlado por WiFi desde un servidor web en una ESP8266.',
    image: 'https://raw.githubusercontent.com/AlePatata/BattleBotMontanna/master/multimedia/bot.jpeg',
    emoji: '🤖',
    link: 'https://github.com/AlePatata/BattleBotMontanna',
    tags: ['Arduino', 'ESP8266', 'C++', 'Trabajo en equipo'],
    year: '2023'
  },
  {
    id: 'puzlitas',
    title: 'Puzlitas',
    description: 'Videojuego de puzzles en Godot donde se recogen palabras y se usan para transformar el escenario, con diálogos, inventario y shaders.',
    emoji: '🧩',
    link: 'https://github.com/AlePatata/Puzlitas',
    tags: ['Godot', 'GDScript', 'Shaders'],
    year: '2024'
  },
  {
    id: 'citric-liquid',
    title: '99.7% Citric Liquid',
    description: 'Clon simplificado del juego de tablero 100% Orange Juice, modelado con patrones de diseño (State, Observer) y tests.',
    emoji: '🍊',
    link: 'https://github.com/AlePatata/citric-liquid-AlePatata',
    tags: ['Scala', 'POO', 'Patrones de diseño'],
    year: '2023'
  },
  {
    id: 'proyecto-mineros',
    title: 'Proyecto Mineros',
    description: 'Análisis exploratorio de un dataset de millones de transacciones con tarjeta de crédito, usuarios y tarjetas, para minería de datos.',
    emoji: '📊',
    link: 'https://github.com/AlePatata/Proyecto-Mineros',
    tags: ['Python', 'Jupyter', 'pandas', 'matplotlib'],
    year: '2024'
  }
];

export const curriculum: Curriculum = {
  // Poner el PDF en public/ (p. ej. public/cv.pdf) y apuntar aquí: '/cv.pdf'
  cvUrl: undefined,
  experience: [],
  education: [
    {
      title: 'Ingeniería Civil en Computación',
      place: 'Facultad de Ciencias Físicas y Matemáticas, Universidad de Chile',
      period: 'En curso · 5to año'
    }
  ],
  skills: ['C++', 'Python', 'TypeScript', 'React', 'C', 'Scala', 'Godot', 'Git', 'Linux', 'Programación competitiva']
};

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
// Los datos de cada hobby los trae el Worker (ver plan/13-hobbies.md)
export const hobbies: Hobby[] = [
  {
    source: 'codeforces',
    name: 'Programación competitiva',
    description: 'Problemas y concursos en Codeforces.',
    url: 'https://codeforces.com/profile/AlePatata92',
  },
  {
    source: 'monkeytype',
    name: 'Typing',
    description: 'Tests de velocidad en Monkeytype.',
    url: 'https://monkeytype.com/profile/AlePatata92',
  },
  {
    source: 'trakt',
    name: 'Películas y series',
    description: 'Lo que voy viendo, registrado en Trakt.',
    url: 'https://trakt.tv/users/alepatata92',
  },
  {
    source: 'wordle',
    name: 'Wordle',
    description: 'El Wordle diario de la NYT, sin spoilers: solo los colores.',
  },
  {
    source: 'cube',
    name: 'Cubos Rubik',
    description: 'Tiempos de Twisty Timer.',
  },
];
