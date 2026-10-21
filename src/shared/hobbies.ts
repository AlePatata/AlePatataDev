// Tipos de la API pública de hobbies, compartidos entre la página y el Worker.

export const HOBBY_SOURCES = ['codeforces', 'monkeytype', 'trakt', 'wordle', 'cube'] as const;

export type HobbySource = (typeof HOBBY_SOURCES)[number];

export interface ActivityDay {
  date: string; // yyyy-mm-dd, hora de Chile
  source: HobbySource;
  count: number;
  summary: string | null;
}

/** `GET /api/public/hobbies` */
export interface HobbiesResponse {
  from: string; // primer día incluido
  to: string; // hoy
  days: ActivityDay[];
}
