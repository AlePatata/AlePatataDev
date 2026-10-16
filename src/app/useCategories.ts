import { useCallback, useEffect, useState } from 'react';
import type { Category } from '../shared/summary';
import { api } from './api';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    api<Category[]>('/api/categories').then(setCategories).catch(() => setCategories([]));
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const byId = (id: number | null) => (id == null ? undefined : categories.find((c) => c.id === id));
  return { categories, byId, reload };
}
