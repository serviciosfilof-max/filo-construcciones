import { createClient } from '@supabase/supabase-js';
import { verifyPassword } from './_password.js';
import { getSupabaseUrl, normalizeText } from './_supabase.js';

function send(res, status, payload) {
  res.status(status).json(payload);
}

function mapUser(row) {
  return {
    id: row.employee_id,
    name: row.full_name,
    role: row.role,
    shift: row.shift,
    email: row.email,
    avatar: row.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.employee_id}`,
    qrCode: row.qr_code || null,
  };
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

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const email = normalizeText(body.email).toLowerCase();
  const employeeId = normalizeText(body.employeeId).toUpperCase();
  const password = normalizeText(body.password);

  if (!email || !employeeId || !password) {
    return send(res, 400, { error: 'Completá correo, ID y clave.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from('employees')
    .select('employee_id, full_name, role, shift, email, avatar_url, qr_code, password_hash')
    .eq('employee_id', employeeId)
    .eq('email', email)
    .maybeSingle();

  if (error) {
    return send(res, 500, { error: error.message });
  }

  if (!data || data.role === 'admin' || !verifyPassword(password, data.password_hash)) {
    return send(res, 401, { error: 'Credenciales de personal incorrectas.' });
  }

  return send(res, 200, { user: mapUser(data) });
}

