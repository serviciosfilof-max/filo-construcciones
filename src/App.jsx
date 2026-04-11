import React, { useEffect, useState } from 'react';
import PublicSite from './PublicSite';
import ConstructoraApp from './ConstructoraApp';
import { defaultSiteContent } from './siteContent';

export default function App() {
  const [mode, setMode] = useState('public');
  const [siteContent, setSiteContent] = useState(() => {
    try {
      const raw = localStorage.getItem('filo_site_content_v1');
      return raw ? { ...defaultSiteContent, ...JSON.parse(raw) } : defaultSiteContent;
    } catch {
      return defaultSiteContent;
    }
  });

  useEffect(() => {
    localStorage.setItem('filo_site_content_v1', JSON.stringify(siteContent));
  }, [siteContent]);

  return mode === 'public' ? (
    <PublicSite content={siteContent} onEnterInternal={() => setMode('internal')} />
  ) : (
    <ConstructoraApp
      siteContent={siteContent}
      onSiteContentChange={setSiteContent}
      onExitToPublic={() => setMode('public')}
    />
  );
}
