import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/react';
import App from './App';
import './styles.css';
import './pwa';

import '@fontsource-variable/inter/index.css';
import '@fontsource-variable/manrope/index.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/noto-serif-ethiopic/400.css';
import '@fontsource/noto-serif-ethiopic/700.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App/>
            <Analytics/>
            <SpeedInsights/>
        </BrowserRouter>
    </React.StrictMode>
);
