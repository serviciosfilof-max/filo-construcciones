import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ProjectQrScanner({ onScan, onClose }) {
  const containerId = useRef(`qr-reader-${Math.random().toString(36).slice(2, 9)}`);
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      containerId.current,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        try {
          await onScanRef.current(decodedText);
          setError('');
          await scanner.clear();
        } catch (scanError) {
          setError(scanError.message || 'No se pudo procesar el QR.');
        }
      },
      () => {}
    );

    return () => {
      scannerRef.current?.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
            Camara activa
          </p>
          <p className="text-sm text-zinc-500">
            Apunta al QR de la obra para registrar entrada o salida.
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-zinc-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition hover:border-black hover:text-black"
        >
          Cerrar camara
        </button>
      </div>

      <div id={containerId.current} className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white p-3" />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
