import React from 'react';

export default function LandingPage() {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Space Grotesk", sans-serif',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Background Gradients */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(212,77,240,0.15) 0%, rgba(0,0,0,0) 65%)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(106,76,245,0.15) 0%, rgba(0,0,0,0) 65%)', filter: 'blur(90px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/nexus-logo.png" alt="Nexus Logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
            <span style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Nexus Drive Organizer</span>
          </div>
          <a href="https://chrome.google.com/webstore" target="_blank" rel="noreferrer" style={{
            background: 'var(--color-primary)',
            color: 'var(--color-primary-text)',
            padding: '10px 24px',
            borderRadius: '99px',
            textDecoration: 'none',
            fontWeight: 600
          }}>Add to Chrome</a>
        </header>

        {/* Hero */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', background: 'linear-gradient(135deg, #fff 0%, #a5a5a5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Organize your Google Drive,<br/>powered by AI.
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '40px', lineHeight: 1.6 }}>
            Nexus Drive Organizer is a Chrome Extension that helps you declutter your workspace. Instantly group loose files using AI, find and delete hidden duplicates, and manually triage files with a lightning-fast interface.
          </p>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', flex: 1, border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>🤖 AI Auto-Pilot</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Automatically categorizes and groups your files based on their content and name.</p>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', flex: 1, border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>🧹 Storage Health</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Scans your entire drive to find byte-for-byte duplicates and helps you reclaim space.</p>
            </div>
          </div>
        </main>

        {/* Footer / Privacy Policy */}
        <footer style={{ marginTop: '80px', paddingTop: '32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <span>© {new Date().getFullYear()} Nexus Drive Organizer.</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#" style={{ color: 'var(--text-secondary)' }}>Privacy Policy: We do not store or sell your Google Drive data. All operations happen locally in your browser.</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
