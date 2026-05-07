import { createClient } from '@supabase/supabase-js';

const BUCKET = 'site-assets';

function send(res, status, payload) {
  res.status(status).json(payload);
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
}

async function ensureAdmin(supabase, actorId) {
  if (!actorId) {
    return false;
  }

  const { data, error } = await supabase
    .from('employees')
    .select('employee_id, role')
    .eq('employee_id', actorId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.role === 'admin';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return send(res, 500, { error: 'Missing Supabase configuration.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const actorId = normalizeText(body.actorId);
  const isAdmin = await ensureAdmin(supabase, actorId);

  if (!isAdmin) {
    return send(res, 403, { error: 'Solo un administrador puede subir imágenes.' });
  }

  const fileName = normalizeText(body.fileName);
  const parsed = parseDataUrl(normalizeText(body.dataUrl));

  if (!parsed || !fileName) {
    return send(res, 400, { error: 'Faltan datos de la imagen.' });
  }

  const buffer = Buffer.from(parsed.base64, 'base64');
  const ext = (fileName.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeExt = ext || (parsed.mimeType === 'image/png' ? 'png' : parsed.mimeType === 'image/webp' ? 'webp' : 'jpg');
  const objectPath = `site-content/${Date.now()}-${slugify(fileName)}.${safeExt}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: parsed.mimeType,
    upsert: false,
  });

  if (uploadError) {
    return send(res, 500, { error: uploadError.message });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

  return send(res, 200, {
    url: data.publicUrl,
    path: objectPath,
  });
}
