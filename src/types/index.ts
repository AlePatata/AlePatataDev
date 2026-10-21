import type { HobbySource } from '../shared/hobbies';

export interface Project {
  id: string;
  title: string;
  description: string;
  image?: string;
  emoji: string;
  link: string;
  tags: string[];
  year: string;
}

export interface CvEntry {
  title: string;
  place: string;
  period: string;
  description?: string;
}

export interface Curriculum {
  cvUrl?: string;
  experience: CvEntry[];
  education: CvEntry[];
  skills: string[];
}

export interface Hobby {
  source: HobbySource;
  name: string;
  description: string;
  url?: string; // perfil público
}
