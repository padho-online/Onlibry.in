
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// RenderX to React metadata handover
document
  .querySelectorAll("head [data-renderx]")
  .forEach(element => element.remove());

// React initialization
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
