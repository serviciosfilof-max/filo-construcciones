import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, normalizeText } from './_supabase.js';

function send(res, status, payload) {
  res.status(status).json(payload);
}

function requireAdminCode(value) {
  const adminCode = normalizeText(process.env.ADMIN_CREATE_CODE);
  return Boolean(adminCode && normalizeText(value) === adminCode);
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function tableFor(type) {
  if (type === 'project') return 'work_projects';
  if (type === 'supply') return 'project_supplies';
  if (type === 'budget') return 'project_budget_items';
  return '';
}

function publicProjectPayload(body) {
  const id = normalizeText(body.id).toUpperCase();
  return {
    id,
    name: normalizeText(body.name),
    location: normalizeText(body.location),
    progress: Math.max(0, Math.min(100, numberValue(body.progress))),
    budget: normalizeText(body.budget),
    access_code: normalizeText(body.access_code || body.accessCode || `FILO-${id}`),
    status: normalizeText(body.status),
    state: normalizeText(body.state || 'activa').toLowerCase(),
  };
}

function supplyPayload(body) {
  return {
    id: normalizeText(body.id) || undefined,
    project_id: normalizeText(body.project_id).toUpperCase(),
    name: normalizeText(body.name),
    stock: numberValue(body.stock),
    unit: normalizeText(body.unit),
    status: normalizeText(body.status || 'OK'),
    assigned_role: normalizeText(body.assigned_role || 'todos'),
    notes: normalizeText(body.notes),
  };
}

function budgetPayload(body) {
  return {
    id: normalizeText(body.id) || undefined,
    project_id: normalizeText(body.project_id).toUpperCase(),
    category: normalizeText(body.category || 'Insumos'),
    detail: normalizeText(body.detail),
    amount: numberValue(body.amount),
    kind: normalizeText(body.kind || 'presupuesto').toLowerCase(),
  };
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
    const [projectsResult, suppliesResult, budgetsResult] = await Promise.all([
      supabase.from('work_projects').select('*').order('created_at', { ascending: false }),
      supabase.from('project_supplies').select('*').order('created_at', { ascending: false }),
      supabase.from('project_budget_items').select('*').order('created_at', { ascending: false }),
    ]);

    const firstError = projectsResult.error || suppliesResult.error || budgetsResult.error;
    if (firstError) return send(res, 500, { error: firstError.message });

    return send(res, 200, {
      projects: projectsResult.data || [],
      supplies: suppliesResult.data || [],
      budgets: budgetsResult.data || [],
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (!requireAdminCode(body.admin_code)) {
    return send(res, 401, { error: 'Invalid admin code.' });
  }

  if (req.method === 'POST') {
    const type = normalizeText(body.type);
    const table = tableFor(type);
    if (!table) return send(res, 400, { error: 'Tipo no soportado.' });

    let payload;
    let onConflict = 'id';
    if (type === 'project') payload = publicProjectPayload(body);
    if (type === 'supply') payload = supplyPayload(body);
    if (type === 'budget') payload = budgetPayload(body);

    if (type === 'project' && (!payload.id || !payload.name)) {
      return send(res, 400, { error: 'Falta código y nombre de obra.' });
    }
    if ((type === 'supply' || type === 'budget') && !payload.project_id) {
      return send(res, 400, { error: 'Falta elegir la obra.' });
    }

    if (!payload.id) {
      delete payload.id;
      onConflict = undefined;
    }

    const query = onConflict
      ? supabase.from(table).upsert(payload, { onConflict }).select('*').single()
      : supabase.from(table).insert(payload).select('*').single();
    const { data, error } = await query;

    if (error) return send(res, 500, { error: error.message });
    return send(res, 200, { item: data });
  }

  if (req.method === 'DELETE') {
    const type = normalizeText(body.type);
    const table = tableFor(type);
    const id = normalizeText(body.id);
    if (!table || !id) return send(res, 400, { error: 'Falta el registro a eliminar.' });

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return send(res, 500, { error: error.message });
    return send(res, 200, { ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return send(res, 405, { error: 'Method not allowed' });
}
