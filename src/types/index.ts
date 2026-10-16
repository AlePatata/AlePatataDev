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
