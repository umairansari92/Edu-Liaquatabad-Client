import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/index.js';
import App from './App.jsx';
import { registerPwaServiceWorker } from './registerServiceWorker.js';
import { initializeReliabilityEngine, initAutoSync } from './services/reliability/index.js';
import apiClient from './services/apiClient.js';
import toast from 'react-hot-toast';
import { installSafeToastSafeguards } from './utils/errorUtils.js';
import './styles/index.css';

// Install global safeguard against raw Error object rendering in toasts
installSafeToastSafeguards(toast);

// Initialize production Progressive Web App service worker and Central Reliability Engine
registerPwaServiceWorker();
initializeReliabilityEngine();
initAutoSync(apiClient, () => store.getState().auth?.user?._id || store.getState().auth?.user?.userId);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

