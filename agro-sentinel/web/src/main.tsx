import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initData, readSettings } from '@cognitex/data';

import '@cognitex/theme/tokens.css';
// Self-hosted variable subsets. The old index.html linked no font stylesheet
// at all, so the console rendered in whatever the machine's system font was.
import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';

import App from './App';

// Firebase is initialised before the first render, so `isConfigured()` is
// already settled when `useAuth` and the repositories ask. Getting this order
// wrong is what made the previous app decide it was in demo mode during the
// first paint and then change its mind.
initData(readSettings(import.meta.env as unknown as Record<string, string | undefined>));

const container = document.getElementById('root');
if (!container) throw new Error('No se encontró el contenedor #root');

createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>
);
