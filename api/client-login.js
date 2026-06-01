import { createClient } from '@supabase/supabase-js';
import { verifyPassword } from './_password.js';
import { getSupabaseUrl, normalizeText } from './_supabase.js';

function send(res, status, payload) {
  res.status(status).json(payload);
}

function mapProgress(row) {
  return {
    projectId: row.project_id,
    progressPercent: row.progress_percent,
    currentStage: row.current_stage || '',
    nextStep: row.next_step || '',
    estimatedFinish: row.estimated_finish || '',
    summary: row.summary || '',
    mediaUrl: row.media_url || '',
    updatedAt: row.updated_at,
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
  const projectId = normalizeText(body.projectId).toUpperCase();
  const password = normalizeText(body.password);

  if (!email || !projectId || !password) {
    return send(res, 400, { error: 'Completá email, código de obra y clave.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: client, error } = await supabase
    .from('client_access')
    .select('client_id, client_name, email, phone, project_id, password_hash, active')
    .eq('email', email)
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) return send(res, 500, { error: error.message });

  if (!client || !client.active || !verifyPassword(password, client.password_hash)) {
    return send(res, 401, { error: 'Acceso de cliente incorrecto.' });
  }

  const { data: progress, error: progressError } = await supabase
    .from('project_progress')
    .select('project_id, progress_percent, current_stage, next_step, estimated_finish, summary, media_url, updated_at')
    .eq('project_id', projectId)
    .maybeSingle();

  if (progressError) return send(res, 500, { error: progressError.message });

  return send(res, 200, {
    user: {
      id: client.client_id,
      role: 'client',
      name: client.client_name,
      email: client.email,
      phone: client.phone,
      projectId: client.project_id,
    },
    progress: progress ? mapProgress(progress) : null,
  });
}
