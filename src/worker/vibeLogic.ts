import type { VibeDetail, VibeFeature } from '../shared/hobbies';
import { dateInChile } from './monkeytypeLogic';

/** Lo que se usa de cada commit de `GET /repos/:owner/:repo/commits`. */
export interface GhCommit {
  sha: string;
  parents: { sha: string }[];
  commit: { message: string; author: { date: string } | null }; // la fecha del autor: un rebase cambia la del committer
}

export const isWithClaude = (message: string) => /^co-authored-by:\s*claude\b/im.test(message);
const subject = (message: string) => message.split('\n')[0].trim();
const dateOf = (c: GhCommit) => dateInChile(Date.parse(c.commit.author?.date ?? '') || 0);
const MERGE = /^Merge branch '([^']+)'/;

/** Todos los commits alcanzables desde `sha` (incluido), según la lista. */
function ancestors(sha: string, bySha: Map<string, GhCommit>): Set<string> {
  const seen = new Set<string>();
  const stack = [sha];
  while (stack.length) {
    const next = stack.pop()!;
    const commit = bySha.get(next);
    if (seen.has(next) || !commit) continue;
    seen.add(next);
    for (const p of commit.parents) stack.push(p.sha);
  }
  return seen;
}

/** Los merges `Merge branch 'x'` y lo que trajo cada uno (lo del segundo padre que no estaba en el primero). */
export function findFeatures(commits: GhCommit[]): VibeFeature[] {
  const bySha = new Map(commits.map((c) => [c.sha, c]));
  return commits.flatMap((c) => {
    const branch = MERGE.exec(c.commit.message)?.[1];
    if (!branch || c.parents.length < 2) return [];
    const base = ancestors(c.parents[0].sha, bySha);
    const brought = [...ancestors(c.parents[1].sha, bySha)]
      .filter((sha) => !base.has(sha))
      .map((sha) => bySha.get(sha)!)
      .filter((x) => x.parents.length < 2)
      .sort((a, b) => Date.parse(a.commit.author?.date ?? '') - Date.parse(b.commit.author?.date ?? ''));
    return [{ branch, date: dateOf(c), sha: c.sha, commits: brought.map((x) => subject(x.commit.message)) }];
  });
}

/** Un día del heatmap: "4 commits con Claude · terminamos cstimer". */
export function vibeDays(commits: GhCommit[], features: VibeFeature[]): { date: string; count: number; summary: string }[] {
  const counts = new Map<string, number>();
  for (const c of commits) {
    if (c.parents.length > 1 || !isWithClaude(c.commit.message)) continue;
    counts.set(dateOf(c), (counts.get(dateOf(c)) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => {
      const done = features.filter((f) => f.date === date).map((f) => f.branch);
      const finished = done.length > 2 ? `${done.length} features` : done.map((b) => b.replace(/[-_/]+/g, ' ')).join(' y ');
      const summary = `${count} ${count === 1 ? 'commit' : 'commits'} con Claude${done.length ? ` · terminamos ${finished}` : ''}`;
      return { date, count, summary };
    });
}

/** Todo lo del "Ver más". `commits` viene como lo da GitHub: el más reciente primero. */
export function vibeDetail(commits: GhCommit[]): VibeDetail {
  const own = commits.filter((c) => c.parents.length < 2);
  const withClaude = own.filter((c) => isWithClaude(c.commit.message));
  const features = findFeatures(commits);
  const days = new Set(withClaude.map(dateOf));
  return {
    totals: {
      commits: own.length,
      withClaude: withClaude.length,
      features: features.length,
      days: days.size,
      since: withClaude.length ? [...days].sort()[0] : null,
    },
    features: features.slice(0, 12),
    recent: withClaude.slice(0, 10).map((c) => ({ sha: c.sha, date: dateOf(c), subject: subject(c.commit.message) })),
  };
}
