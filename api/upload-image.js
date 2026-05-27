import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, normalizeText } from './_supabase.js';

const BUCKET = 'site-assets';
const MAX_FILE_SIZE_BYTES = 80 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];

function send(res, status, payload) {
  res.status(status).json(payload);
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
  if (actorId === 'ADM-001') {
    return true;
  }

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

function ensureAdminPassword(password) {
  const adminCode = normalizeText(process.env.ADMIN_CREATE_CODE);
  return Boolean(adminCode && normalizeText(password) === adminCode);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  const supabaseUrl = getSupabaseUrl();
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

  if (!isAdmin || !ensureAdminPassword(body.adminPassword)) {
    return send(res, 403, { error: 'Solo un administrador puede subir archivos.' });
  }

  const fileName = normalizeText(body.fileName);
  const parsed = parseDataUrl(normalizeText(body.dataUrl));

  if (!parsed || !fileName) {
    return send(res, 400, { error: 'Faltan datos del archivo.' });
  }

  if (!ALLOWED_MIME_PREFIXES.some((prefix) => parsed.mimeType.startsWith(prefix))) {
    return send(res, 400, { error: 'Solo se permiten imagenes o videos.' });
  }

  const buffer = Buffer.from(parsed.base64, 'base64');
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    return send(res, 413, { error: 'El archivo supera el mÃ¡ximo de 80 MB.' });
  }

  const ext = (fileName.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeExt = ext || (parsed.mimeType === 'image/png' ? 'png' : parsed.mimeType === 'image/webp' ? 'webp' : parsed.mimeType === 'video/mp4' ? 'mp4' : 'jpg');
  const folder = parsed.mimeType.startsWith('video/') ? 'videos' : 'images';
  const objectPath = `site-content/${folder}/${Date.now()}-${slugify(fileName)}.${safeExt}`;

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

