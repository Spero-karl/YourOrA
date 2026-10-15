import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Native Android initialization
if (Capacitor.isNativePlatform()) {
  try {
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: '#1C1917' });
  } catch (err) {
    console.debug('StatusBar initialization skipped:', err);
  }
}

createRoot(document.getElementById('root')!).render(<App />);
