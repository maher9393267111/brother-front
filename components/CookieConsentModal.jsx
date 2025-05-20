'use client';

import { useEffect, useState } from 'react';

export default function CookieConsentModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if consent is already given
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setOpen(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setOpen(false);
    // Optionally, trigger GTM event or enable GTM here
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'cookie_consent_accepted' });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-2">We Value Your Privacy</h2>
        <p className="mb-4">
          This site uses cookies and Google Tag Manager to enhance your experience. By accepting, you agree to our privacy policy.
        </p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleAccept}
        >
          Accept
        </button>
      </div>
    </div>
  );
}