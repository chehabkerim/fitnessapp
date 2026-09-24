import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Web document shell (static export). Manifest, theme colours, icons and viewport for the installable PWA.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Plus Ultra</title>
        <meta name="description" content="A calm, local-first training log." />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0E0E10" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Plus Ultra" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const css = `
:root { --pu-bg: #0E0E10; --pu-focus: #39FF14; }
html, body { background-color: var(--pu-bg); overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
*:focus { outline: none; }
*:focus-visible { outline: 2px solid var(--pu-focus) !important; outline-offset: 2px; border-radius: 6px; }
input { font-size: 16px; }
`;
