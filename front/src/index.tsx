import React from 'react';
import { createRoot } from 'react-dom/client';
import Application from './main';
const container = document.getElementById('app') as HTMLElement;
const root = createRoot(container);
root.render(<Application/>);