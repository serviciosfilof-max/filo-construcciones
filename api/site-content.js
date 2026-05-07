import { createClient } from '@supabase/supabase-js';
import { defaultSiteContent } from '../src/siteContent.js';

const SITE_CONTENT_ID = 'main';

function send(res, status, payload) {
  res.status(status).json(payload);
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeContent(input) {
  const content = input && typeof input === 'object' ? input : {};
  return {
    ...defaultSiteContent,
    ...content,
    hero: {
      ...defaultSiteContent.hero,
      ...(content.hero || {}),
    },
    contact: {
      ...defaultSiteContent.contact,
      ...(content.contact || {}),
    },
    sections: Array.isArray(content.sections) && content.sections.length ? content.sections : defaultSiteContent.sections,
    highlights: Array.isArray(content.highlights) && content.highlights.length ? content.highlights : defaultSiteContent.highlights,
    projects: Array.isArray(content.projects) && content.projects.length ? content.projects : defaultSiteContent.projects,
    services: Array.isArray(content.services) && content.services.length ? content.services : defaultSiteContent.services,
    footer: {
      ...defaultSiteContent.footer,
      ...(content.footer || {}),
    },
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

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('site_content')
      .select('content, updated_at')
      .eq('id', SITE_CONTENT_ID)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return send(res, 500, { error: error.message });
    }

    return send(res, 200, {
      content: normalizeContent(data?.content || defaultSiteContent),
      updatedAt: data?.updated_at || null,
    });
  }

  if (req.method === 'POST' || req.method === 'PATCH') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const actorId = normalizeText(body.actorId);
    const isAdmin = await ensureAdmin(supabase, actorId);

    if (!isAdmin) {
      return send(res, 403, { error: 'Solo un administrador puede editar el contenido.' });
    }

    const content = normalizeContent(body.content);
    const { data, error } = await supabase
      .from('site_content')
      .upsert(
        {
          id: SITE_CONTENT_ID,
          content,
        },
        { onConflict: 'id' }
      )
      .select('content, updated_at')
      .single();

    if (error) {
      return send(res, 500, { error: error.message });
    }

    return send(res, 200, {
      content: normalizeContent(data?.content || content),
      updatedAt: data?.updated_at || null,
    });
  }

  return send(res, 405, { error: 'Method not allowed' });
}
