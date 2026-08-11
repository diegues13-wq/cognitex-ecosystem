import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initData, readSettings } from '@cognitex/data';

import './occ.css';
// Self-hosted variable subsets. The old index.html preconnected to Google
// Fonts and then never linked a stylesheet, so the console rendered in the
// system font on every machine in every control room.
import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';

import App from './App';

// Firebase is initialised before the first render so `isConfigured()` is
// already settled when `useAuth` asks — and, here specifically, before
// anything can try to read an ID token for the API.
initData(readSettings(import.meta.env as unknown as Record<string, string | undefined>));

const container = document.getElementById('root');
if (!container) throw new Error('No se encontró el contenedor #root');

createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>
);
