import React, { useEffect, useRef, useState } from 'react';
import PublicSite from './PublicSite';
import ConstructoraApp from './ConstructoraApp';
import { defaultSiteContent } from './siteContent';
import { fetchSiteContent } from './lib/siteContentApi';

export default function App() {
  const [mode, setMode] = useState('public');
  const [siteContentSource, setSiteContentSource] = useState('local');
  const [siteContent, setSiteContent] = useState(() => {
    try {
      const raw = localStorage.getItem('filo_site_content_cache_v2');
      return raw ? { ...defaultSiteContent, ...JSON.parse(raw) } : defaultSiteContent;
    } catch {
      return defaultSiteContent;
    }
  });
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('filo_site_content_cache_v2', JSON.stringify(siteContent));
  }, [siteContent]);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      try {
        const content = await fetchSiteContent();
        if (cancelled || !content) return;
        setSiteContent({ ...defaultSiteContent, ...content });
        setSiteContentSource('supabase');
      } catch {
        if (!cancelled) {
          setSiteContentSource('local');
        }
      } finally {
        if (!cancelled) {
          hasHydratedRef.current = true;
        }
      }
    }

    loadContent();

    const refreshTimer = setInterval(() => {
      if (!hasHydratedRef.current) return;
      fetchSiteContent()
        .then((content) => {
          if (content) {
            setSiteContent({ ...defaultSiteContent, ...content });
            setSiteContentSource('supabase');
          }
        })
        .catch(() => {
          setSiteContentSource((prev) => prev || 'local');
        });
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(refreshTimer);
    };
  }, []);

  return mode === 'public' ? (
    <PublicSite content={siteContent} contentSource={siteContentSource} onEnterInternal={() => setMode('internal')} />
  ) : (
    <ConstructoraApp
      siteContent={siteContent}
      onSiteContentChange={setSiteContent}
      siteContentSource={siteContentSource}
      onExitToPublic={() => setMode('public')}
    />
  );
}
