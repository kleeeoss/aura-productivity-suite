import { useAppStore, type Tab } from '../store/useAppStore';
import { Home, Focus, CheckSquare, FileText, Activity, BookOpen, BarChart2, Settings as SettingsIcon, Hexagon } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'focus', label: 'Focus', icon: Focus },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'habits', label: 'Habits', icon: Activity },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'statistics', label: 'Statistics', icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar = () => {
  const { activeTab, setActiveTab, avatar, userName } = useAppStore();

  return (
    <div className="sidebar">
      <div style={{ padding: '20px 0', fontSize: '1.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-family)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '12px', background: 'var(--accent-gradient)', color: 'white' }}>
          <Hexagon size={24} fill="currentColor" />
        </div>
        <span style={{ letterSpacing: '2px' }}>AURA</span>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`glass-button ${isActive ? 'primary' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', border: isActive ? 'none' : '' }}
              onClick={() => setActiveTab(item.id as Tab)}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', cursor: 'pointer' }} onClick={() => setActiveTab('settings')}>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '20px', 
          background: avatar ? `url(${avatar}) center/cover` : 'var(--accent-gradient)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontWeight: 'bold', color: '#fff', fontSize: '1.2rem'
        }}>
          {!avatar && userName.charAt(0).toUpperCase()}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: '500' }}>{userName}</div>
        </div>
      </div>
    </div>
  );
};
