import { createClient } from '@supabase/supabase-js';
import { hashPassword } from './_password.js';
import { getSupabaseUrl, normalizeText } from './_supabase.js';

const ALLOWED_ROLES = new Set(['supervisor', 'tecnico_vertical', 'operario', 'administrativo']);

function send(res, status, payload) {
  res.status(status).json(payload);
}

function normalizeOptionalUrl(value) {
  const trimmed = normalizeText(value);
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return send(res, 405, { error: 'Method not allowed' });
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminCreateCode = process.env.ADMIN_CREATE_CODE;

  if (!supabaseUrl || !supabaseServiceRoleKey || !adminCreateCode) {
    return send(res, 500, { error: 'Missing Supabase or admin configuration.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const adminCode = normalizeText(body.admin_code);

  if (!adminCode || adminCode !== adminCreateCode) {
    return send(res, 401, { error: 'Invalid admin code.' });
  }

  const employee_id = normalizeText(body.employee_id).toUpperCase();
  const full_name = normalizeText(body.full_name);
  const role = normalizeText(body.role);
  const shift = normalizeText(body.shift);
  const email = normalizeText(body.email).toLowerCase();
  const avatar_url = normalizeOptionalUrl(body.avatar_url);
  const password = normalizeText(body.password);

  if (!employee_id || !full_name || !role || !shift || !email || !password) {
    return send(res, 400, { error: 'Missing required employee fields.' });
  }

  if (password.length < 4) {
    return send(res, 400, { error: 'La clave del empleado debe tener al menos 4 caracteres.' });
  }

  if (!ALLOWED_ROLES.has(role)) {
    return send(res, 400, { error: 'Invalid role.' });
  }

  const qr_code = body.qr_code ? normalizeText(body.qr_code) : `CTLOGIN|${employee_id}|${email}|${role}`;

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from('employees')
    .upsert(
      {
        employee_id,
        full_name,
        role,
        shift,
        email,
        avatar_url: avatar_url || null,
        password_hash: hashPassword(password),
        qr_code,
      },
      { onConflict: 'employee_id' }
    )
    .select('employee_id, full_name, role, shift, email, avatar_url, qr_code')
    .single();

  if (error) {
    return send(res, 500, { error: error.message });
  }

  return send(res, 200, { employee: data });
}
