import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * The design system names 'Inter Variable' and 'Space Grotesk Variable', and
 * until now no app in the ecosystem ever linked them — every one preconnected
 * to Google Fonts and then loaded no stylesheet, so all six silently rendered
 * in the system font. These are the self-hosted subsets, and the Cyrillic
 * ranges in them are not optional here: a third of this page is Russian.
 */
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/space-grotesk/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';

import './index.css';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from index.html');

createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
