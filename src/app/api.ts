/**
 * `fetch` a la API que devuelve el JSON o lanza un `Error` con el mensaje del servidor.
 * El body va como JSON, salvo un archivo (`Blob`), que va tal cual.
 */
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const body = init?.body;
  const res = await fetch(path, {
    method: init?.method ?? 'GET',
    headers: body !== undefined && !(body instanceof Blob) ? { 'content-type': 'application/json' } : undefined,
    body: body === undefined ? undefined : body instanceof Blob ? body : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
  return data as T;
}
