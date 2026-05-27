import { hasSupabaseEnv, supabase } from './supabaseClient';

const SITE_CONTENT_ENDPOINT = '/api/site-content';
const SITE_IMAGE_UPLOAD_ENDPOINT = '/api/upload-image';
const SITE_UPLOAD_URL_ENDPOINT = '/api/upload-url';
const ADMIN_LOGIN_ENDPOINT = '/api/admin-login';
const STAFF_LOGIN_ENDPOINT = '/api/staff-login';

async function readJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'No se pudo completar la solicitud.');
  }
  return payload;
}

export async function fetchSiteContent() {
  const response = await fetch(SITE_CONTENT_ENDPOINT);
  const payload = await readJsonResponse(response);
  return payload.content || payload;
}

export async function loginAdmin({ email, employeeId, password }) {
  const response = await fetch(ADMIN_LOGIN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      employeeId,
      password,
    }),
  });

  return readJsonResponse(response);
}

export async function loginStaff({ email, employeeId, password }) {
  const response = await fetch(STAFF_LOGIN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      employeeId,
      password,
    }),
  });

  return readJsonResponse(response);
}

export async function saveSiteContent(content, actorId, adminPassword) {
  const response = await fetch(SITE_CONTENT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actorId,
      adminPassword,
      content,
    }),
  });

  const payload = await readJsonResponse(response);
  return payload.content || payload;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadSiteImage(file, actorId, adminPassword) {
  if (!file) {
    throw new Error('Selecciona un archivo para subir.');
  }

  if (file.type?.startsWith('video/')) {
    if (!hasSupabaseEnv || !supabase) {
      throw new Error('Falta configurar Supabase para subir videos.');
    }

    const response = await fetch(SITE_UPLOAD_URL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actorId,
        adminPassword,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      }),
    });

    const payload = await readJsonResponse(response);
    const { error } = await supabase.storage.from(payload.bucket).uploadToSignedUrl(payload.path, payload.token, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      throw new Error(error.message || 'No se pudo subir el video a Supabase.');
    }

    return payload.url;
  }

  const dataUrl = await fileToDataUrl(file);
  const response = await fetch(SITE_IMAGE_UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actorId,
      adminPassword,
      fileName: file.name,
      mimeType: file.type,
      dataUrl,
    }),
  });

  const payload = await readJsonResponse(response);
  return payload.url;
}
