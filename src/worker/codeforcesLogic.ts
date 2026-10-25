import type { CfContest, CfSolved, CodeforcesDetail } from '../shared/hobbies';
import { dateInChile } from './monkeytypeLogic';

/** Envío tal como lo entrega `user.status` (solo lo que se usa). */
export interface ApiSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  problem: { contestId?: number; index: string; name: string; rating?: number; tags: string[] };
  author: { participantType: string };
  verdict?: string;
}

/** Concurso tal como lo entrega `user.rating`. */
export interface ApiRatingChange {
  contestId: number;
  contestName: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

/** Fila de `cf_submissions`. */
export interface SubmissionRow {
  id: number;
  timestamp: number;
  date: string;
  contestId: number | null;
  index: string;
  name: string;
  rating: number | null;
  tags: string[];
  verdict: string | null;
  participantType: string;
}

export const toSubmissionRow = (s: ApiSubmission): SubmissionRow => ({
  id: s.id,
  timestamp: s.creationTimeSeconds,
  date: dateInChile(s.creationTimeSeconds * 1000),
  contestId: s.problem.contestId ?? s.contestId ?? null,
  index: s.problem.index,
  name: s.problem.name,
  rating: s.problem.rating ?? null,
  tags: s.problem.tags,
  verdict: s.verdict ?? null,
  participantType: s.author.participantType,
});

export const toContest = (r: ApiRatingChange): CfContest & { timestamp: number } => ({
  contestId: r.contestId,
  name: r.contestName,
  timestamp: r.ratingUpdateTimeSeconds,
  date: dateInChile(r.ratingUpdateTimeSeconds * 1000),
  rank: r.rank,
  oldRating: r.oldRating,
  newRating: r.newRating,
});

const problemKey = (s: SubmissionRow) => `${s.contestId ?? ''}/${s.index}/${s.name}`;

/** El primer AC de cada problema, del más antiguo al más reciente. */
export function firstSolves(submissions: SubmissionRow[]): SubmissionRow[] {
  const seen = new Set<string>();
  return [...submissions]
    .filter((s) => s.verdict === 'OK')
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter((s) => {
      const key = problemKey(s);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Días seguidos con al menos un AC: la racha actual (cuenta si el último fue hoy o ayer) y la máxima. */
export function acStreak(acDates: string[], today: string): { current: number; max: number } {
  const days = new Set(acDates);
  let max = 0;
  for (const d of days) {
    if (days.has(addDays(d, -1))) continue; // no es el primero de su racha
    let length = 0;
    for (let day = d; days.has(day); day = addDays(day, 1)) length++;
    max = Math.max(max, length);
  }
  let current = 0;
  for (let day = days.has(today) ? today : addDays(today, -1); days.has(day); day = addDays(day, -1)) current++;
  return { current, max };
}

/** Todo lo del "Ver más", calculado de lo guardado. */
export function codeforcesDetail(
  handle: string,
  submissions: SubmissionRow[],
  contests: CfContest[],
  today: string,
): CodeforcesDetail {
  const solved = firstSolves(submissions);

  const byRating = new Map<number | null, number>();
  for (const s of solved) byRating.set(s.rating, (byRating.get(s.rating) ?? 0) + 1);
  const tags = new Map<string, number>();
  for (const s of solved) for (const t of s.tags) tags.set(t, (tags.get(t) ?? 0) + 1);

  const sortedContests = [...contests].sort((a, b) => a.date.localeCompare(b.date) || a.contestId - b.contestId);
  const last = sortedContests[sortedContests.length - 1];
  const recent: CfSolved[] = solved
    .slice(-10)
    .reverse()
    .map((s) => ({ contestId: s.contestId, index: s.index, name: s.name, rating: s.rating, date: s.date }));

  return {
    handle,
    rating: last ? last.newRating : null,
    maxRating: sortedContests.length ? Math.max(...sortedContests.map((c) => c.newRating)) : null,
    contests: sortedContests,
    submissions: submissions.length,
    solved: solved.length,
    streak: acStreak(
      submissions.filter((s) => s.verdict === 'OK').map((s) => s.date),
      today,
    ),
    byRating: [...byRating.entries()]
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => (a.rating ?? Infinity) - (b.rating ?? Infinity)),
    tags: [...tags.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, 8),
    recent,
  };
}

/** Un día del heatmap: "3 AC de 5 envíos, máx 1300" o "2 envíos, sin AC". */
export function codeforcesDays(submissions: SubmissionRow[]): { date: string; count: number; summary: string }[] {
  const byDate = new Map<string, SubmissionRow[]>();
  for (const s of submissions) {
    const day = byDate.get(s.date) ?? [];
    day.push(s);
    byDate.set(s.date, day);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, day]) => {
      const ac = day.filter((s) => s.verdict === 'OK');
      const sent = `${day.length} ${day.length === 1 ? 'envío' : 'envíos'}`;
      if (!ac.length) return { date, count: day.length, summary: `${sent}, sin AC` };
      const ratings = ac.map((s) => s.rating).filter((r): r is number => r != null);
      const max = ratings.length ? `, máx ${Math.max(...ratings)}` : '';
      return { date, count: day.length, summary: `${ac.length} AC de ${sent}${max}` };
    });
}
