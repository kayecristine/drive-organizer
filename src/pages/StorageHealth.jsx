import { useState } from 'react';
import { HardDrive, Trash2, RefreshCw, AlertTriangle, Clock, FileIcon, Video, Image as ImageIcon, FileText, TrendingUp, Copy, CheckCircle } from 'lucide-react';
import { getStorageStats, getStorageQuota, trashFile } from '../lib/gdrive';

function formatBytes(bytes) {
  if (!bytes || bytes === '0') return '0 B';
  const b = parseInt(bytes, 10);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function FileRow({ file, isSelected, onToggle, onTrash, isDeleting }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
      borderBottom: '1px solid var(--border-color)',
      background: isSelected ? 'rgba(16,185,129,0.06)' : 'transparent',
      transition: 'background 0.15s'
    }}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(file.id)}
        style={{ accentColor: 'var(--color-primary)', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <a
          href={file.webViewLink}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={file.name}
        >
          {file.name}
        </a>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(file.createdTime)}</span>
      </div>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
        {formatBytes(file.size)}
      </span>
      <button
        onClick={() => onTrash(file.id)}
        disabled={isDeleting}
        title="Move to Trash"
        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', opacity: isDeleting ? 0.5 : 1 }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function getFileIcon(mimeType) {
  const props = { size: 40, color: 'var(--text-secondary)', style: { opacity: 0.5 } };
  if (!mimeType) return <FileIcon {...props} />;
  if (mimeType.startsWith('video/')) return <Video {...props} />;
  if (mimeType.startsWith('image/')) return <ImageIcon {...props} />;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return <FileText {...props} />;
  return <FileIcon {...props} />;
}

function DuplicateCard({ file, isKept, onTrash, isDeleting }) {
  return (
    <div style={{
      border: `2px solid ${isKept ? 'var(--color-primary)' : 'var(--border-color)'}`,
      borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-main)',
      display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s',
      opacity: isDeleting ? 0.4 : 1, position: 'relative'
    }}>
      {isKept && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <div style={{ background: 'var(--color-primary)', borderRadius: '20px', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={11} /> Keep
          </div>
        </div>
      )}
      {/* Thumbnail */}
      <div style={{ height: 120, background: 'var(--hover-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {file.thumbnailLink
          ? <img src={file.thumbnailLink} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : getFileIcon(file.mimeType)
        }
      </div>
      {/* Meta */}
      <div style={{ padding: '10px 12px', flex: 1 }}>
        <a
          href={file.webViewLink} target="_blank" rel="noreferrer"
          style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}
          title={file.name}
        >{file.name}</a>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{formatDate(file.createdTime)}</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatBytes(file.size)}</span>
      </div>
      {/* Actions */}
      {!isKept && (
        <button
          onClick={() => onTrash(file.id)}
          disabled={isDeleting}
          style={{ margin: '0 12px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: '8px', padding: '7px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Trash2 size={13} /> Remove duplicate
        </button>
      )}
    </div>
  );
}

function DuplicateGroup({ group, onTrash, deletingIds, onTrashAllButOldest }) {
  const filename = group[0]?.name || 'Unknown';
  // Keep the oldest (lowest createdTime index) — most likely the original
  const keptId = [...group].sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime))[0]?.id;

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }} title={filename}>
          <Copy size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {filename}
        </span>
        <button
          onClick={() => onTrashAllButOldest(group, keptId)}
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: '8px', padding: '5px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
        >
          <Trash2 size={13} /> Remove all duplicates
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {group.map(f => (
          <DuplicateCard
            key={f.id}
            file={f}
            isKept={f.id === keptId}
            onTrash={onTrash}
            isDeleting={deletingIds.has(f.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, files, selectedIds, onToggle, onTrash, deletingIds, emptyMsg }) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleAll = () => {
    if (files.every(f => selectedIds.has(f.id))) {
      files.forEach(f => onToggle(f.id, false));
    } else {
      files.forEach(f => onToggle(f.id, true));
    }
  };
  const allSelected = files.length > 0 && files.every(f => selectedIds.has(f.id));

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '24px' }}>
      <div
        onClick={() => setIsOpen(o => !o)}
        style={{ position: 'sticky', top: 0, zIndex: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'var(--hover-color)', backdropFilter: 'blur(10px)', borderTopLeftRadius: '11px', borderTopRightRadius: '11px', borderBottomLeftRadius: isOpen ? 0 : '11px', borderBottomRightRadius: isOpen ? 0 : '11px' }}
      >
        <Icon size={20} color="var(--color-primary)" />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</span>
          {subtitle && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 10 }}>{subtitle}</span>}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-main)', padding: '2px 10px', borderRadius: 20 }}>{files.length} files</span>
      </div>

      {isOpen && (
        <div>
          {files.length === 0 ? (
            <p style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>{emptyMsg}</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor: 'var(--color-primary)', width: 16, height: 16, cursor: 'pointer' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select all</span>
              </div>
              {files.map(f => (
                <FileRow
                  key={f.id}
                  file={f}
                  isSelected={selectedIds.has(f.id)}
                  onToggle={(id) => onToggle(id)}
                  onTrash={onTrash}
                  isDeleting={deletingIds.has(f.id)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function StorageHealth() {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const runScan = async () => {
    setStatus('loading');
    setError('');
    setStats(null);
    setSelectedIds(new Set());
    try {
      const files = await getStorageStats();

      // Largest files — non-Google-Workspace files (they don't consume storage quota)
      const withSize = files.filter(f => f.size && parseInt(f.size) > 0);
      const largest = [...withSize].sort((a, b) => parseInt(b.size) - parseInt(a.size)).slice(0, 25);

      // Oldest files
      const oldest = [...files]
        .filter(f => f.createdTime)
        .sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime))
        .slice(0, 25);

      // Duplicate detection: group by name + size into arrays of 2+ files
      const grouped = {};
      for (const f of files) {
        const key = `${f.name}__${f.size || '0'}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(f);
      }
      const duplicateGroups = Object.values(grouped).filter(g => g.length > 1);
      const duplicates = duplicateGroups.flat(); // keep flat list for stats count

      // Storage Quota
      const quota = await getStorageQuota();

      setStats({ largest, oldest, duplicates, duplicateGroups, totalFiles: files.length, quota });
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Failed to scan Drive.');
      setStatus('error');
    }
  };

  const toggleSelect = (id, forceOn) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (forceOn === true) next.add(id);
      else if (forceOn === false) next.delete(id);
      else if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const trashSingle = async (fileId) => {
    setDeletingIds(prev => new Set(prev).add(fileId));
    try {
      await trashFile(fileId);
      setStats(prev => ({
        ...prev,
        largest: prev.largest.filter(f => f.id !== fileId),
        oldest: prev.oldest.filter(f => f.id !== fileId),
        duplicates: prev.duplicates.filter(f => f.id !== fileId),
        totalFiles: prev.totalFiles - 1
      }));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(fileId); return n; });
    } catch (err) {
      alert('Failed to trash: ' + err.message);
    } finally {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(fileId); return n; });
    }
  };

  const trashSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(`Move ${selectedIds.size} file(s) to Trash?`);
    if (!confirmed) return;
    setIsBulkDeleting(true);
    const ids = [...selectedIds];
    
    setStats(prev => ({
      ...prev,
      largest: prev.largest.filter(f => !ids.includes(f.id)),
      oldest: prev.oldest.filter(f => !ids.includes(f.id)),
      duplicates: prev.duplicates.filter(f => !ids.includes(f.id)),
      totalFiles: prev.totalFiles - ids.length
    }));
    setSelectedIds(new Set());
    
    await Promise.all(ids.map(id => trashFile(id).catch(e => console.error(e))));
    setIsBulkDeleting(false);
  };

  const trashAllButOldest = async (group, keptId) => {
    const toDelete = group.filter(f => f.id !== keptId);
    const confirmed = window.confirm(`Remove ${toDelete.length} duplicate(s), keeping the oldest copy?`);
    if (!confirmed) return;
    
    setIsBulkDeleting(true);
    setStats(prev => ({
      ...prev,
      duplicateGroups: prev.duplicateGroups.filter(g => !g.some(f => f.id === group[0].id)),
      duplicates: prev.duplicates.filter(f => !toDelete.some(d => d.id === f.id))
    }));
    
    await Promise.all(toDelete.map(f => trashFile(f.id).catch(e => console.error(e))));
    setIsBulkDeleting(false);
  };

  const trashAllDuplicatesAcrossAllGroups = async () => {
    const allToDelete = [];
    stats.duplicateGroups.forEach(group => {
      const keptId = [...group].sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime))[0]?.id;
      allToDelete.push(...group.filter(f => f.id !== keptId));
    });
    if (!allToDelete.length) return;
    const confirmed = window.confirm(`Are you sure you want to remove ${allToDelete.length} duplicates across all groups? This will keep one original file for each group.`);
    if (!confirmed) return;
    
    setIsBulkDeleting(true);
    setStats(prev => ({
      ...prev,
      duplicateGroups: [],
      duplicates: prev.duplicates.filter(f => !allToDelete.some(d => d.id === f.id))
    }));
    
    await Promise.all(allToDelete.map(f => trashFile(f.id).catch(e => console.error(e))));
    setIsBulkDeleting(false);
  };

  const totalStorageUsed = stats
    ? formatBytes(
        stats.largest.slice(0, 100).reduce((sum, f) => sum + parseInt(f.size || 0, 10), 0).toString()
      )
    : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HardDrive size={32} color="var(--color-primary)" />
            Storage Health
          </h1>
          <p style={{ margin: '4px 0 0 44px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Find large files, old files, and duplicates to reclaim Drive storage.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {selectedIds.size > 0 && (
            <button
              onClick={trashSelected}
              disabled={isBulkDeleting}
              style={{ background: 'var(--color-danger)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isBulkDeleting ? <RefreshCw size={16} className="spin" /> : <Trash2 size={16} />}
              Trash {selectedIds.size} selected
            </button>
          )}
          <button
            onClick={runScan}
            disabled={status === 'loading'}
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {status === 'loading' ? <RefreshCw size={16} className="spin" /> : <TrendingUp size={16} />}
            {status === 'loading' ? 'Scanning...' : status === 'done' ? 'Re-scan' : 'Run Storage Scan'}
          </button>
        </div>
      </div>

      {/* Error */}
      {status === 'error' && (
        <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {/* Idle State */}
      {status === 'idle' && (
        <div style={{ textAlign: 'center', padding: '80px 64px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
          <HardDrive size={64} color="var(--text-secondary)" style={{ margin: '0 auto 24px', opacity: 0.4 }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Analyze your Drive storage</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 32px' }}>
            Scan your entire Drive to surface the largest files, oldest files, and exact duplicates — so you know exactly what to clean up.
          </p>
          <button
            onClick={runScan}
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', padding: '14px 32px', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <TrendingUp size={20} />
            Run Storage Scan
          </button>
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <div style={{ textAlign: 'center', padding: '80px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
          <RefreshCw size={48} color="var(--color-primary)" className="spin" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Scanning your Drive...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>This may take a moment for large Drives.</p>
        </div>
      )}

      {/* Results */}
      {status === 'done' && stats && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Summary pills */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {stats.quota && stats.quota.limit && (
              <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 20px', flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Storage Quota</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>How much of your Google Drive limit is consumed</div>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {formatBytes(stats.quota.usage)} / {formatBytes(stats.quota.limit)}
                  </div>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                  <div style={{ width: `${Math.min(100, (parseInt(stats.quota.usage) / parseInt(stats.quota.limit)) * 100)}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }} />
                </div>
              </div>
            )}
            {[
              { label: 'Total Files Scanned', value: stats.totalFiles.toLocaleString() },
              { label: 'Duplicates Found', value: stats.duplicates.length.toLocaleString() },
              { label: 'Files in "Largest" List', value: stats.largest.length.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 20px', flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)' }}>{value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          <Section
            icon={TrendingUp}
            title="Largest Files"
            subtitle="Files consuming the most storage quota"
            files={stats.largest}
            selectedIds={selectedIds}
            onToggle={toggleSelect}
            onTrash={trashSingle}
            deletingIds={deletingIds}
            emptyMsg="No large files found. Your Drive is lean!"
          />

          {/* Duplicates — grouped thumbnail view */}
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--hover-color)', backdropFilter: 'blur(10px)', borderTopLeftRadius: '11px', borderTopRightRadius: '11px' }}>
              <Copy size={20} color="var(--color-primary)" />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Potential Duplicates</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 10 }}>Files with identical name and size</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-main)', padding: '4px 12px', borderRadius: 20 }}>
                  {stats.duplicateGroups?.length || 0} groups
                </span>
                {stats.duplicateGroups?.length > 0 && (
                  <button
                    onClick={trashAllDuplicatesAcrossAllGroups}
                    disabled={isBulkDeleting}
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isBulkDeleting ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
                    Remove all duplicates
                  </button>
                )}
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              {!stats.duplicateGroups?.length ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>No duplicates detected. Your Drive is clean!</p>
              ) : (
                stats.duplicateGroups.map((group, i) => (
                  <DuplicateGroup
                    key={i}
                    group={group}
                    onTrash={trashSingle}
                    deletingIds={deletingIds}
                    onTrashAllButOldest={trashAllButOldest}
                  />
                ))
              )}
            </div>
          </div>

          <Section
            icon={Clock}
            title="Oldest Files"
            subtitle="Files that haven't been touched in years"
            files={stats.oldest}
            selectedIds={selectedIds}
            onToggle={toggleSelect}
            onTrash={trashSingle}
            deletingIds={deletingIds}
            emptyMsg="No old files found."
          />
        </div>
      )}
    </div>
  );
}
