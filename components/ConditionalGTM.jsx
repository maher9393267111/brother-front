'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function ConditionalGTM() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('cookie_consent') === 'accepted') {
      setConsent(true);
    }
  }, []);

  if (!consent) return null;

  return (
    <>
      {/* Google Tag Manager */}
      <Script id="gtm-head" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-N5D27MCH');
        `}
      </Script>
      {/* End Google Tag Manager */}
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-N5D27MCH"
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        ></iframe>
      </noscript>
    </>
  );
}