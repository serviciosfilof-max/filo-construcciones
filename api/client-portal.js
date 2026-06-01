import { createClient } from '@supabase/supabase-js';
import { hashPassword } from './_password.js';
import { getSupabaseUrl, normalizeText } from './_supabase.js';

function send(res, status, payload) {
  res.status(status).json(payload);
}

function requireAdminCode(value) {
  const adminCode = normalizeText(process.env.ADMIN_CREATE_CODE);
  return Boolean(adminCode && normalizeText(value) === adminCode);
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

  if (req.method === 'GET') {
    if (!requireAdminCode(req.query.admin_code)) {
      return send(res, 401, { error: 'Invalid admin code.' });
    }

    const { data: clients, error: clientsError } = await supabase
      .from('client_access')
      .select('client_id, client_name, email, phone, project_id, active, created_at')
      .order('created_at', { ascending: false });

    if (clientsError) return send(res, 500, { error: clientsError.message });

    const { data: progress, error: progressError } = await supabase
      .from('project_progress')
      .select('project_id, progress_percent, current_stage, next_step, estimated_finish, summary, media_url, updated_at')
      .order('updated_at', { ascending: false });

    if (progressError) return send(res, 500, { error: progressError.message });

    return send(res, 200, { clients: clients || [], progress: progress || [] });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return send(res, 405, { error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  if (!requireAdminCode(body.admin_code)) {
    return send(res, 401, { error: 'Invalid admin code.' });
  }

  const action = normalizeText(body.action);

  if (action === 'client') {
    const client_id = normalizeText(body.client_id).toUpperCase();
    const client_name = normalizeText(body.client_name);
    const email = normalizeText(body.email).toLowerCase();
    const phone = normalizeText(body.phone);
    const project_id = normalizeText(body.project_id).toUpperCase();
    const password = normalizeText(body.password);
    const active = body.active !== false;

    if (!client_id || !client_name || !email || !project_id) {
      return send(res, 400, { error: 'Faltan datos del cliente.' });
    }

    const payload = { client_id, client_name, email, phone, project_id, active };
    if (password) {
      if (password.length < 4) {
        return send(res, 400, { error: 'La clave del cliente debe tener al menos 4 caracteres.' });
      }
      payload.password_hash = hashPassword(password);
    }

    const { data, error } = await supabase
      .from('client_access')
      .upsert(payload, { onConflict: 'client_id' })
      .select('client_id, client_name, email, phone, project_id, active, created_at')
      .single();

    if (error) return send(res, 500, { error: error.message });
    return send(res, 200, { client: data });
  }

  if (action === 'progress') {
    const project_id = normalizeText(body.project_id).toUpperCase();
    const progress_percent = Math.max(0, Math.min(100, Number(body.progress_percent || 0)));
    const current_stage = normalizeText(body.current_stage);
    const next_step = normalizeText(body.next_step);
    const estimated_finish = normalizeText(body.estimated_finish);
    const summary = normalizeText(body.summary);
    const media_url = normalizeOptionalUrl(body.media_url);

    if (!project_id) {
      return send(res, 400, { error: 'Falta elegir la obra.' });
    }

    const { data, error } = await supabase
      .from('project_progress')
      .upsert(
        {
          project_id,
          progress_percent,
          current_stage,
          next_step,
          estimated_finish,
          summary,
          media_url: media_url || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'project_id' }
      )
      .select('project_id, progress_percent, current_stage, next_step, estimated_finish, summary, media_url, updated_at')
      .single();

    if (error) return send(res, 500, { error: error.message });
    return send(res, 200, { progress: data });
  }

  return send(res, 400, { error: 'Acción no soportada.' });
}
