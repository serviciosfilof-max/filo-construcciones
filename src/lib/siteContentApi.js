const SITE_CONTENT_ENDPOINT = '/api/site-content';
const SITE_IMAGE_UPLOAD_ENDPOINT = '/api/upload-image';

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

export async function saveSiteContent(content, actorId) {
  const response = await fetch(SITE_CONTENT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actorId,
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
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadSiteImage(file, actorId) {
  if (!file) {
    throw new Error('Selecciona una imagen para subir.');
  }

  const dataUrl = await fileToDataUrl(file);
  const response = await fetch(SITE_IMAGE_UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actorId,
      fileName: file.name,
      mimeType: file.type,
      dataUrl,
    }),
  });

  const payload = await readJsonResponse(response);
  return payload.url;
}
