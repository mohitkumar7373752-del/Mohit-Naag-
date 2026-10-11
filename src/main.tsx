import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { StreakProvider } from './context/StreakContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <StreakProvider>
      <App />
    </StreakProvider>
  </ThemeProvider>
);
