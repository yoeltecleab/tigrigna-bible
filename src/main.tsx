import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/react';
import App from './App';
import '@fontsource/noto-serif-ethiopic/400.css';
import '@fontsource/noto-serif-ethiopic/600.css';
import './styles.css';
import './pwa';
import './store/installStore';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App/>
            <Analytics/>
            <SpeedInsights/>
        </BrowserRouter>
    </React.StrictMode>
);
