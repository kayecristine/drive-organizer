import { useState } from 'react';
import DriveOrganizer from './pages/DriveOrganizer';
import StorageHealth from './pages/StorageHealth';
import { FolderKanban, HardDrive } from 'lucide-react';

const TABS = [
  { id: 'organizer', label: 'File Manager', icon: FolderKanban },
  { id: 'storage', label: 'Storage Health', icon: HardDrive },
];

function App() {
  const [activeTab, setActiveTab] = useState('organizer');

  return (
    <div className="app-container">
      {/* Framer Ambient Gradient Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(212,77,240,0.35) 0%, rgba(0,0,0,0) 65%)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(106,76,245,0.35) 0%, rgba(0,0,0,0) 65%)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(255,122,61,0.25) 0%, rgba(0,0,0,0) 65%)', filter: 'blur(90px)' }} />
      </div>

      {/* Top Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px'
      }}>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', marginRight: '24px', letterSpacing: '0px' }}>
          NEXUS
        </span>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '7px 16px', border: 'none', borderRadius: '9999px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.15s',
              background: activeTab === id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === id ? 'var(--color-primary-text)' : 'var(--text-secondary)',
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* Page */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'organizer' && <DriveOrganizer />}
        {activeTab === 'storage' && <StorageHealth />}
      </div>
    </div>
  );
}

export default App;
