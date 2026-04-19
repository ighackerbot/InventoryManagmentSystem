import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
