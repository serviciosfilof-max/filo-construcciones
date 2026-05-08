export function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getSupabaseUrl() {
  const rawUrl = normalizeText(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  if (!rawUrl) return '';

  try {
    const url = new URL(rawUrl);
    url.pathname = url.pathname.replace(/\/(?:rest|auth|storage)\/v1\/?$/i, '').replace(/\/+$/g, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/g, '');
  } catch {
    return '';
  }
}

