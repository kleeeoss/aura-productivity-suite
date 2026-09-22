import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { MiniPlayer } from './components/MiniPlayer';
import { useAppStore } from './store/useAppStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useTimer } from './hooks/useTimer';
import { AnimatePresence, motion } from 'framer-motion';

import Dashboard from './views/Dashboard';
import Focus from './views/Focus';
import Tasks from './views/Tasks';
import Notes from './views/Notes';
import Habits from './views/Habits';
import Journal from './views/Journal';
import Statistics from './views/Statistics';
import Settings from './views/Settings';

function App() {
  const { isFocusModeActive, activeTab } = useAppStore();
  const { theme, mode, font, accentColor, disableAnimations, reduceMotion, uiScale, focusSpaces, setActiveSpace } = useSettingsStore();
  
  // Mount global timer
  useTimer();

  // Global shortcuts for Focus Spaces (Ctrl+1, Ctrl+2, Ctrl+3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '1' && focusSpaces[0]) {
          e.preventDefault();
          setActiveSpace(focusSpaces[0].id);
        } else if (e.key === '2' && focusSpaces[1]) {
          e.preventDefault();
          setActiveSpace(focusSpaces[1].id);
        } else if (e.key === '3' && focusSpaces[2]) {
          e.preventDefault();
          setActiveSpace(focusSpaces[2].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusSpaces, setActiveSpace]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', mode);
    document.documentElement.setAttribute('data-font', font);
    document.documentElement.style.setProperty('--accent-primary', accentColor);
    
    // Apply UI Scaling
    const scale = uiScale / 100;
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.transform = `scale(${scale})`;
      rootElement.style.transformOrigin = 'top left';
      rootElement.style.width = `${100 / scale}%`;
      rootElement.style.height = `${100 / scale}%`;
      rootElement.style.position = 'absolute';
      rootElement.style.overflow = 'hidden';
    }
    // Accessibility: Animations & Motion
    if (disableAnimations) {
      document.documentElement.classList.add('disable-animations');
    } else {
      document.documentElement.classList.remove('disable-animations');
    }
    
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [theme, mode, font, accentColor, disableAnimations, reduceMotion, uiScale]);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'focus': return <Focus />;
      case 'tasks': return <Tasks />;
      case 'notes': return <Notes />;
      case 'habits': return <Habits />;
      case 'journal': return <Journal />;
      case 'statistics': return <Statistics />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={isFocusModeActive ? 'focus-mode-active' : ''} style={{ width: '100%', height: '100%', display: 'flex' }}>
      <div className="bg-shape bg-shape-1" />
      <div className="bg-shape bg-shape-2" />
      
      <Sidebar />
      <div className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ height: '100%' }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>
      <CommandPalette />
      <MiniPlayer />
    </div>
  );
}

export default App;
