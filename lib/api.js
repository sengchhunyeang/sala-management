// Browser-side JSON fetch helper. Throws an Error with the server's message on failure.
export async function api(method, url, body){
  const res = await fetch(url, {
    method, cache:'no-store',
    headers: body === undefined ? undefined : { 'Content-Type':'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return json;
}
