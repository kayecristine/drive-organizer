import { useState, useEffect } from 'react';
import { Folder, Search, Check, RefreshCw, AlertCircle, Eye, Edit2, Layers, FileIcon, X, Plus, HardDrive, Video, Image as ImageIcon, FileText, ChevronRight, ChevronDown, Trash2, ArrowLeft, Upload, Tag, CheckCircle, FolderKanban, ListTodo, Inbox } from 'lucide-react';
import { initGoogleDrive, getLooseFiles, createFolder, moveFile, renameFile, listFolders, getFilesInFolder, getSubfolders, trashFile, searchDrive, uploadToDrive, ensureDriveToken, getFileContentSnippet } from '../lib/gdrive';
import { suggestFolderCategory, getSavedApiKey, saveApiKey, clearApiKey, getRemainingFreeScans } from '../lib/ai';


function getFileIcon(mimeType, size = 32, isAbsolute = true) {
  const props = {
    size,
    color: "var(--text-secondary)",
    style: { opacity: 0.5, ...(isAbsolute ? { position: 'absolute' } : {}) }
  };
  if (!mimeType) return <FileIcon {...props} />;
  if (mimeType.startsWith('video/')) return <Video {...props} />;
  if (mimeType.startsWith('image/')) return <ImageIcon {...props} />;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return <FileText {...props} />;
  return <FileIcon {...props} />;
}

function FolderTreeItem({ folder, depth, currentFolderId, onSelect, onDrop, folderSearchQuery }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [subfolders, setSubfolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleExpand = async (e) => {
    e.stopPropagation();
    if (!isExpanded) {
      setIsLoading(true);
      try {
        const subs = await getSubfolders(folder.id);
        setSubfolders(subs);
      } catch (err) {
        console.error("Failed to fetch subfolders", err);
      }
      setIsLoading(false);
    }
    setIsExpanded(!isExpanded);
  };

  const isVisible = folderSearchQuery ? folder.name.toLowerCase().includes(folderSearchQuery.toLowerCase()) : true;

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }}>
      <div 
        onClick={() => onSelect(folder.id)}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => { if(currentFolderId!==folder.id) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; } }}
        onDragLeave={(e) => { if(currentFolderId!==folder.id) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; } }}
        onDrop={(e) => { 
          e.currentTarget.style.borderColor = 'transparent'; 
          e.currentTarget.style.background = 'transparent'; 
          onDrop(e, folder.id); 
        }}
        style={{ 
          padding: `8px 12px 8px ${8 + depth * 16}px`, 
          background: currentFolderId === folder.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent', 
          border: '1px solid', borderColor: currentFolderId === folder.id ? 'var(--color-primary)' : 'transparent', 
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', cursor: 'pointer'
        }}
      >
        <button onClick={toggleExpand} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
          {isLoading ? <RefreshCw size={14} className="spin" /> : 
           isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <Folder size={16} color={currentFolderId === folder.id ? 'var(--color-primary)' : 'var(--text-secondary)'} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: currentFolderId === folder.id ? 700 : 500, color: currentFolderId === folder.id ? 'var(--color-primary)' : 'var(--text-primary)' }}>{folder.name}</span>
      </div>
      
      {isExpanded && subfolders.map(sub => (
        <FolderTreeItem key={sub.id} folder={sub} depth={depth + 1} currentFolderId={currentFolderId} onSelect={onSelect} onDrop={onDrop} folderSearchQuery={folderSearchQuery} />
      ))}
    </div>
  );
}

export default function DriveOrganizer() {
  const [mode, setMode] = useState('ai'); 
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]); 
  const [proposals, setProposals] = useState([]); 
  const [error, setError] = useState('');

  // Cross-folder State
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [folderHistory, setFolderHistory] = useState(['root']);
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());

  const [newFolderSidebar, setNewFolderSidebar] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');

  // BYOK modal state
  const [showByokModal, setShowByokModal] = useState(false);
  const [byokInput, setByokInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [savedKey, setSavedKey] = useState(null);
  const [remainingFreeScans, setRemainingFreeScans] = useState(null);

  // Pending inbox banner (from background auto-scan)
  const [pendingInboxCount, setPendingInboxCount] = useState(0);

  // Global Search State
  const [globalSearchInput, setGlobalSearchInput] = useState('');
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState(null);

  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    if (!globalSearchInput.trim()) {
      setGlobalSearchResults(null);
      return;
    }
    setIsSearchingGlobal(true);
    try {
      const results = await searchDrive(globalSearchInput.trim());
      setGlobalSearchResults(results);
    } catch (err) {
      alert("Search failed: " + err.message);
    } finally {
      setIsSearchingGlobal(false);
    }
  };

  const clearGlobalSearch = () => {
    setGlobalSearchInput('');
    setGlobalSearchResults(null);
    setSelectedFileIds(new Set());
  };

  const handleTrashSelected = async () => {
    if (selectedFileIds.size === 0) return;
    const confirmed = window.confirm(`Move ${selectedFileIds.size} selected items to the trash?`);
    if (!confirmed) return;
    
    setIsMoving(true);
    try {
      for (const id of selectedFileIds) {
        await trashFile(id);
      }
      setFiles(prev => prev.filter(f => !selectedFileIds.has(f.id)));
      if (globalSearchResults) {
        setGlobalSearchResults(prev => prev.filter(f => !selectedFileIds.has(f.id)));
      }
      setSelectedFileIds(new Set());
    } catch (err) {
      alert("Failed to trash some files: " + err.message);
    } finally {
      setIsMoving(false);
    }
  };

  const handleBack = () => {
    if (folderHistory.length <= 1) return;
    const newHistory = [...folderHistory];
    newHistory.pop(); // Remove current folder
    const prevFolderId = newHistory[newHistory.length - 1]; // Get previous folder
    setFolderHistory(newHistory);
    handleSelectFolder(prevFolderId, true);
  };

  // Manual Triage Modal State (Rename)
  const [activeFile, setActiveFile] = useState(null);
  const [editName, setEditName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Smart Inbox Filter State
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'folders', 'files'
  const [isUploading, setIsUploading] = useState(false);

  // Drag and Drop State
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    initGoogleDrive();


    // Load BYOK key and free scan info
    getSavedApiKey().then(k => setSavedKey(k));
    getRemainingFreeScans().then(n => setRemainingFreeScans(n));

    // Check for pending inbox items from background auto-scan
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['pendingInbox'], result => {
        const pending = result.pendingInbox || [];
        setPendingInboxCount(pending.length);
      });
    }
  }, []);

  const fetchManualData = async () => {
    try {
      setStep(2);
      setError('');
      const looseFiles = await getLooseFiles();
      const existingFolders = await listFolders();
      setFiles(looseFiles);
      setFolders(existingFolders);
      setCurrentFolderId('root');
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to load files.");
      setStep(1);
    }
  };

  const handleSelectFolder = async (folderId, isBack = false) => {
    setSelectedFileIds(new Set());
    if (globalSearchResults !== null) {
      setGlobalSearchInput('');
      setGlobalSearchResults(null);
    }
    if (folderId === currentFolderId) return;
    
    if (!isBack) {
      setFolderHistory(prev => [...prev, folderId]);
    }
    
    setCurrentFolderId(folderId);
    setIsLoadingGrid(true);
    try {
      if (folderId === 'root') {
        const loose = await getLooseFiles();
        setFiles(loose);
      } else {
        const contents = await getFilesInFolder(folderId);
        setFiles(contents);
      }
    } catch (err) {
      alert("Failed to load folder: " + err.message);
      setCurrentFolderId('root');
    } finally {
      setIsLoadingGrid(false);
    }
  };

  const handleScanAI = async () => {
    try {
      setStep(2);
      setError('');
      const allFiles = await getLooseFiles();
      const filesOnly = allFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');
      setFiles(filesOnly);

      if (filesOnly.length === 0) {
        setStep(1);
        setError('No loose files found in your Drive root! You are already organized.');
        return;
      }

      // Fetch content snippets for Google Workspace files to improve AI quality
      const filesWithContent = await Promise.all(
        filesOnly.map(async f => {
          const snippet = await getFileContentSnippet(f.id, f.mimeType);
          return { ...f, contentSnippet: snippet };
        })
      );

      let aiResponse;
      try {
        aiResponse = await suggestFolderCategory(filesWithContent);
      } catch (err) {
        if (err.message === 'BYOK_REQUIRED') {
          setStep(1);
          setShowByokModal(true);
          return;
        }
        throw err;
      }

      const mappedProposals = aiResponse.map(proposal => ({
        folderName: proposal.folderName,
        files: proposal.fileIds.map(id => filesWithContent.find(f => f.id === id)).filter(Boolean)
      }));

      setProposals(mappedProposals);
      setRemainingFreeScans(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to scan Drive.");
      setStep(1);
    }
  };

  const handleSaveByok = async () => {
    if (!byokInput.trim()) return;
    setIsSavingKey(true);
    await saveApiKey(byokInput.trim());
    setSavedKey(byokInput.trim());
    setByokInput('');
    setIsSavingKey(false);
    setShowByokModal(false);
    // Retry the scan now that we have a key
    handleScanAI();
  };

  const handleClearByok = async () => {
    await clearApiKey();
    setSavedKey(null);
  };

  const dismissPendingInbox = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(['pendingInbox']);
    }
    setPendingInboxCount(0);
  };

  const executeAIOrganization = async () => {
    try {
      setStep(4);
      setError('');
      for (const proposal of proposals) {
        if (proposal.files.length === 0) continue;
        const folder = await createFolder(proposal.folderName);
        setFolders(prev => [folder, ...prev]); // Add to sidebar
        for (const file of proposal.files) {
          await moveFile(file.id, folder.id);
        }
      }
      setStep(5);
    } catch (err) {
      setError(err.message || "Failed during organization.");
      setStep(3);
    }
  };

  // --- Manual Actions ---
  const openModal = async (file) => {
    setActiveFile(file);
    setEditName(file.name);
  };

  const executeSaveModal = async () => {
    if (!activeFile) return;
    setIsRenaming(true);
    try {
      if (editName && editName !== activeFile.name && !String(activeFile.id).startsWith('local_')) {
        await renameFile(activeFile.id, editName);
      }
      setFiles(files.map(f => f.id === activeFile.id ? { ...f, name: editName } : f));
      setFolders(folders.map(f => f.id === activeFile.id ? { ...f, name: editName } : f));
      if (globalSearchResults) {
        setGlobalSearchResults(globalSearchResults.map(f => f.id === activeFile.id ? { ...f, name: editName } : f));
      }
      
      setActiveFile(null);
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCreateFolderSidebar = async () => {
    if (!newFolderSidebar.trim()) return;
    setIsCreatingFolder(true);
    try {
      const newFolder = await createFolder(newFolderSidebar.trim());
      
      // Always add to root sidebar since createFolder creates at the drive root
      setFolders(prev => [newFolder, ...prev]);
      
      if (currentFolderId === 'root') {
        setFiles(prev => [newFolder, ...prev]); // show in grid too if in root
      }
      
      setNewFolderSidebar('');
    } catch (err) {
      alert("Failed to create folder: " + err.message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleFileUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    const newFiles = [];
    try {
      let hasToken = false;
      try {
        await ensureDriveToken();
        hasToken = true;
      } catch {
        hasToken = false;
      }

      for (const file of Array.from(fileList)) {
        if (hasToken) {
          try {
            const res = await uploadToDrive(file, { category: 'inbox', tags: ['inbox'] });
            const fileObj = {
              id: res.id,
              name: file.name,
              mimeType: file.type || 'application/octet-stream',
              webViewLink: res.webViewLink
            };
            newFiles.push(fileObj);
          } catch (e) {
            console.error('Drive upload failed, adding locally:', e);
            const localId = 'local_' + Math.random().toString(36).slice(2, 10);
            const fileObj = { id: localId, name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size };
            newFiles.push(fileObj);
          }
        } else {
          const localId = 'local_' + Math.random().toString(36).slice(2, 10);
          const fileObj = { id: localId, name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size };
          newFiles.push(fileObj);
        }
      }
      setFiles(prev => [...newFiles, ...prev]);
      if (globalSearchResults) {
        setGlobalSearchResults(prev => [...newFiles, ...prev]);
      }
      if (step === 1) {
        setStep(3);
        setCurrentFolderId('root');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileUpload(e.dataTransfer.files);
      return;
    }
    const rawData = e.dataTransfer.getData('fileIds');
    const singleId = e.dataTransfer.getData('fileId');
    
    if (!rawData && !singleId) return;
    if (!targetFolderId || targetFolderId === currentFolderId) return;

    let fileIds = [];
    if (rawData) {
      try {
        fileIds = JSON.parse(rawData);
      } catch {
        if (singleId) fileIds = [singleId];
      }
    } else if (singleId) {
      fileIds = [singleId];
    }
    
    if (fileIds.length === 0) return;
    
    // Prevent dragging a folder into itself
    fileIds = fileIds.filter(id => id !== targetFolderId);
    if (fileIds.length === 0) return;

    setIsMoving(true);
    try {
      for (const fileId of fileIds) {
        if (targetFolderId === 'trash') {
          await trashFile(fileId);
        } else {
          await moveFile(fileId, targetFolderId);
        }
      }
      // Remove from grid immediately since it moved out of current folder
      setFiles(files.filter(f => !fileIds.includes(f.id)));
      if (globalSearchResults) {
        setGlobalSearchResults(globalSearchResults.filter(f => !fileIds.includes(f.id)));
      }
      
      // If a root folder was moved, remove it from the sidebar
      if (currentFolderId === 'root') {
        setFolders(folders.filter(f => !fileIds.includes(f.id)));
      }
      
      setSelectedFileIds(new Set());
    } catch (err) {
      alert("Failed to move item(s): " + err.message);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* BYOK MODAL */}
      {showByokModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', maxWidth: 480, width: '90%' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🤖 AI Scan — API Key Required
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              {remainingFreeScans === 0
                ? 'You have used all your free AI scans. Enter your OpenAI API key to continue using AI Auto-Pilot. Your key is stored locally and never sent to our servers.'
                : 'Enter your OpenAI API key to power AI Auto-Pilot. Your key is stored locally in your browser and is never sent to our servers.'}
            </p>
            <input
              type="password"
              placeholder="sk-..."
              value={byokInput}
              onChange={e => setByokInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveByok()}
              style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
              autoFocus
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Get a key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>platform.openai.com/api-keys</a>. Uses gpt-4o-mini (very low cost).
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowByokModal(false)} style={{ background: 'var(--hover-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSaveByok} disabled={!byokInput.trim() || isSavingKey} style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSavingKey ? <RefreshCw size={16} className="spin" /> : null} Save & Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PENDING INBOX BANNER */}
      {pendingInboxCount > 0 && (
        <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid var(--color-primary)', borderRadius: '10px', padding: '12px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Inbox size={18} color="var(--color-primary)" />
          <span style={{ flex: 1, fontSize: '0.9rem' }}>
            <strong style={{ color: 'var(--color-primary)' }}>{pendingInboxCount} new file{pendingInboxCount > 1 ? 's' : ''}</strong> landed in your Drive while you were away. Open File Manager to triage them.
          </span>
          <button onClick={dismissPendingInbox} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>
      )}
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Folder size={32} color="var(--color-primary)" />
            Files & Smart Inbox
          </h1>
          <p style={{ margin: '4px 0 0 44px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Centralize your documents, triage incoming files, and link assets directly to projects or tasks.
          </p>
        </div>
        
        {step === 1 && (
          <div style={{ display: 'flex', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            <button 
              onClick={() => setMode('ai')}
              style={{
                padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: 600,
                background: mode === 'ai' ? 'var(--color-primary)' : 'transparent',
                color: mode === 'ai' ? 'var(--color-primary-text)' : 'var(--text-secondary)'
              }}
            >
              AI Auto-Pilot
            </button>
            <button 
              onClick={() => setMode('manual')}
              style={{
                padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: 600,
                background: mode === 'manual' ? 'var(--color-primary)' : 'transparent',
                color: mode === 'manual' ? 'var(--color-primary-text)' : 'var(--text-secondary)'
              }}
            >
              Manual Triage
            </button>
          </div>
        )}
      </div>
      
      {step === 1 && (
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {mode === 'ai' ? "Let AI automatically group your loose files into organized folders." : "Drag and drop your files between folders to sort them rapidly."}
        </p>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* STEP 1: INITIAL */}
      {step === 1 && (
        <div style={{ textAlign: 'center', padding: '64px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          {mode === 'ai' ? <Layers size={64} color="var(--text-secondary)" style={{ margin: '0 auto 24px', opacity: 0.5 }} /> : <HardDrive size={64} color="var(--text-secondary)" style={{ margin: '0 auto 24px', opacity: 0.5 }} />}
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Ready to clean up?</h2>
          <button 
            onClick={mode === 'ai' ? handleScanAI : fetchManualData}
            style={{
              background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', padding: '12px 24px',
              borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontWeight: 600
            }}
          >
            <Search size={18} />
            {mode === 'ai' ? "Scan My Drive" : "Open File Manager"}
          </button>
        </div>
      )}

      {/* STEP 2: LOADING */}
      {step === 2 && (
        <div style={{ textAlign: 'center', padding: '64px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <RefreshCw size={48} color="var(--color-primary)" className="spin" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>{mode === 'ai' ? "Scanning & Analyzing..." : "Fetching Drive..."}</h2>
        </div>
      )}

      {/* STEP 3: AI REVIEW */}
      {step === 3 && mode === 'ai' && (
        <div>
          {/* AI Content remains unchanged */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem' }}>AI Proposed Organization</h2>
            <button 
              onClick={executeAIOrganization}
              style={{
                background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', padding: '10px 20px', borderRadius: '8px',
                fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600
              }}
            >
              <Check size={18} />
              Confirm & Organize Now
            </button>
          </div>

          <div style={{ display: 'grid', gap: '24px' }}>
            {proposals.map((proposal, i) => (
              <div key={i} style={{ background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', background: 'var(--hover-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Folder size={20} color="var(--color-primary)" />
                  <h3 style={{ margin: 0 }}>{proposal.folderName}</h3>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {proposal.files.map((f, idx) => (
                    <li key={idx} style={{ padding: '12px 24px', borderBottom: idx !== proposal.files.length - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)' }}></span>
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: MANUAL TRIAGE (CROSS-FOLDER FILE MANAGER) */}
      {step === 3 && mode === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {folderHistory.length > 1 && (
                <button 
                  onClick={handleBack}
                  style={{ background: 'var(--hover-color)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 600 }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                {currentFolderId === 'root' ? `Drive Root (${files.length} items)` : `Folder Contents (${files.length} items)`}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {selectedFileIds.size > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>{selectedFileIds.size} selected</span>
                  <button onClick={() => setSelectedFileIds(new Set())} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', color: 'var(--text-primary)', cursor: 'pointer' }}>Clear</button>
                </div>
              )}
              {isMoving && <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--color-primary)' }}><RefreshCw size={14} className="spin" /> Moving item(s)...</span>}
            </div>
          </div>

          <div className="drive-organizer-body" style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
            
            {/* LEFT SIDEBAR: FOLDERS */}
            <div className="drive-organizer-sidebar" style={{ width: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: 'var(--hover-color)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardDrive size={18} /> File Manager
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="New Folder..." 
                    value={newFolderSidebar} 
                    onChange={(e) => setNewFolderSidebar(e.target.value)}
                    style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                  />
                  <button 
                    onClick={handleCreateFolderSidebar} 
                    disabled={!newFolderSidebar.trim() || isCreatingFolder} 
                    style={{ background: 'var(--color-primary)', border: 'none', borderRadius: '6px', color: 'black', padding: '0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isCreatingFolder ? <RefreshCw size={16} className="spin" /> : <Plus size={16} />}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 8px', marginTop: '8px' }}>
                  <Search size={14} color="var(--text-secondary)" />
                  <input 
                    type="text" 
                    placeholder="Search folders..." 
                    value={folderSearchQuery}
                    onChange={(e) => setFolderSearchQuery(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                
                {/* ROOT FOLDER ITEM */}
                <div 
                  onClick={() => handleSelectFolder('root')}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => { if(currentFolderId!=='root') { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; } }}
                  onDragLeave={(e) => { if(currentFolderId!=='root') { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; } }}
                  onDrop={(e) => { 
                    e.currentTarget.style.borderColor = 'transparent'; 
                    e.currentTarget.style.background = 'transparent'; 
                    handleDrop(e, 'root'); 
                  }}
                  style={{ 
                    padding: '8px 12px', background: currentFolderId === 'root' ? 'rgba(16, 185, 129, 0.15)' : 'transparent', border: '1px solid', borderColor: currentFolderId === 'root' ? 'var(--color-primary)' : 'transparent', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', cursor: 'pointer', marginBottom: '8px'
                  }}
                >
                  <Layers size={16} color={currentFolderId === 'root' ? 'var(--color-primary)' : 'var(--text-secondary)'} />
                  <span style={{ fontSize: '0.9rem', fontWeight: currentFolderId === 'root' ? 700 : 500, color: currentFolderId === 'root' ? 'var(--color-primary)' : 'var(--text-primary)' }}>Drive Root</span>
                </div>

                {folders.map(folder => (
                  <FolderTreeItem 
                    key={folder.id} 
                    folder={folder} 
                    depth={0} 
                    currentFolderId={currentFolderId} 
                    onSelect={handleSelectFolder} 
                    onDrop={handleDrop} 
                    folderSearchQuery={folderSearchQuery} 
                  />
                ))}
              </div>

              {/* TRASH BIN */}
              <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  onDrop={(e) => { 
                    e.currentTarget.style.borderColor = 'transparent'; 
                    e.currentTarget.style.background = 'transparent'; 
                    e.currentTarget.style.color = 'var(--text-secondary)'; 
                    handleDrop(e, 'trash'); 
                  }}
                  style={{ 
                    padding: '12px 16px', background: 'transparent', border: '1px solid transparent', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', color: 'var(--text-secondary)'
                  }}
                >
                  <Trash2 size={18} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Trash Bin</span>
                </div>
              </div>
            </div>

            {/* RIGHT GRID: FILES */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px', display: 'flex', flexDirection: 'column' }}>
              
              {/* GLOBAL SEARCH & FILTERS BAR */}
              <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-main)', paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <form onSubmit={handleGlobalSearch} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px 12px' }}>
                  <Search size={18} color="var(--text-secondary)" />
                  <input 
                    type="text" 
                    placeholder="Search entire Drive for files and folders..." 
                    value={globalSearchInput}
                    onChange={(e) => {
                      setGlobalSearchInput(e.target.value);
                      if (e.target.value === '') setGlobalSearchResults(null);
                    }}
                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem' }}
                  />
                  {globalSearchResults !== null && (
                    <button type="button" onClick={clearGlobalSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                      <X size={18} />
                    </button>
                  )}
                  <button type="submit" disabled={isSearchingGlobal || !globalSearchInput.trim()} style={{ marginLeft: '12px', background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSearchingGlobal ? <RefreshCw size={16} className="spin" /> : "Search"}
                  </button>
                </form>

                {/* FILTER TABS & UPLOAD ACTION */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                    <button
                      onClick={() => setActiveTab('all')}
                      style={{ padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, background: activeTab === 'all' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'all' ? 'var(--color-primary-text)' : 'var(--text-secondary)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Layers size={14} /> All Items
                    </button>
                    <button
                      onClick={() => setActiveTab('folders')}
                      style={{ padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, background: activeTab === 'folders' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'folders' ? 'var(--color-primary-text)' : 'var(--text-secondary)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Folder size={14} /> Folders Only
                    </button>
                    <button
                      onClick={() => setActiveTab('files')}
                      style={{ padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, background: activeTab === 'files' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'files' ? 'var(--color-primary-text)' : 'var(--text-secondary)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileIcon size={14} /> Loose Files
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedFileIds.size > 0 && (
                      <button
                        onClick={handleTrashSelected}
                        disabled={isMoving}
                        style={{ background: 'var(--color-danger)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                      >
                        {isMoving ? <RefreshCw size={15} className="spin" /> : <Trash2 size={15} />}
                        Trash {selectedFileIds.size}
                      </button>
                    )}
                    <label style={{
                      background: 'var(--color-primary)', color: 'var(--color-primary-text)', padding: '8px 16px', borderRadius: '8px',
                      fontSize: '0.85rem', fontWeight: 600, cursor: isUploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      opacity: isUploading ? 0.7 : 1, transition: 'all 0.15s'
                    }}>
                      {isUploading ? <RefreshCw size={15} className="spin" /> : <Upload size={15} />}
                      {isUploading ? 'Uploading...' : 'Upload Files'}
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(e.target.files)}
                        style={{ display: 'none' }}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>

                {/* DRAG AND DROP ZONE BANNER */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onDrop={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileUpload(e.dataTransfer.files);
                    } else {
                      handleDrop(e, currentFolderId);
                    }
                  }}
                  style={{
                    border: '1px dashed var(--border-color)', borderRadius: '10px', padding: '12px', textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                  }}
                >
                  <Upload size={16} />
                  <span>Drag & drop documents or images here to instantly upload to Smart Inbox</span>
                </div>
              </div>

              {/* GRID */}
              <div style={{ flex: 1 }}>
                {isLoadingGrid || isSearchingGlobal ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-primary)' }}>
                    <RefreshCw size={48} className="spin" style={{ marginBottom: '16px' }} />
                    <p>{isSearchingGlobal ? "Searching your Drive..." : "Fetching files..."}</p>
                  </div>
                ) : (() => {
                  const rawList = globalSearchResults || files;
                  const displayedFiles = rawList.filter(file => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    if (activeTab === 'folders' && !isFolder) return false;
                    if (activeTab === 'files' && isFolder) return false;
                    return true;
                  });

                  if (displayedFiles.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '64px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Check size={48} color="#10b981" style={{ margin: '0 auto 24px' }} />
                        <h2 style={{ fontSize: '1.5rem' }}>{globalSearchResults ? "No results found" : activeTab === 'folders' ? "No Folders" : activeTab === 'files' ? "No Loose Files" : "Folder is Empty"}</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{globalSearchResults ? "Try a different search term." : "You can drag items or upload files to populate this folder."}</p>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                      {displayedFiles.map(file => {
                        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                        const isSelected = selectedFileIds.has(file.id);
                        
                        return (
                          <div 
                            key={file.id} 
                            draggable
                            onDragStart={(e) => {
                              const payloadIds = selectedFileIds.has(file.id) ? Array.from(selectedFileIds) : [file.id];
                              e.dataTransfer.setData('fileIds', JSON.stringify(payloadIds));
                              e.dataTransfer.setData('fileId', file.id); // fallback
                              e.currentTarget.style.opacity = '0.5';
                            }}
                            onDragEnd={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                            onDoubleClick={() => {
                              if (isFolder) handleSelectFolder(file.id);
                            }}
                            style={{ 
                              background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-panel)', 
                              border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-color)', 
                              borderRadius: '12px', 
                              padding: '12px', cursor: 'grab', display: 'flex', flexDirection: 'column', gap: '10px',
                              transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            onClick={() => {
                              const newSet = new Set(selectedFileIds);
                              if (newSet.has(file.id)) {
                                newSet.delete(file.id);
                              } else {
                                newSet.add(file.id);
                              }
                              setSelectedFileIds(newSet);
                            }}
                          >
                            {/* Checkbox Overlay */}
                            <div 
                              style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const newSet = new Set(selectedFileIds);
                                  if (e.target.checked) newSet.add(file.id);
                                  else newSet.delete(file.id);
                                  setSelectedFileIds(newSet);
                                }}
                                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                              />
                            </div>

                            {/* Click overlay for renaming / triage */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); openModal(file); }}
                              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', zIndex: 10, color: 'white' }}
                              title="Triage & Metadata"
                            >
                              <Edit2 size={14} />
                            </button>

                            <div style={{ height: '110px', background: 'var(--hover-color)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', pointerEvents: 'none' }}>
                              {isFolder ? (
                                <Folder size={64} color="var(--color-primary)" style={{ opacity: 0.8 }} />
                              ) : (
                                <>
                                  {getFileIcon(file.mimeType, 32, true)}
                                  {file.thumbnailLink && (
                                    <img src={file.thumbnailLink} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 1 }} onError={(e) => { e.target.style.display = 'none'; }} />
                                  )}
                                </>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}>
                                {file.name}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              </div>
            </div>

          </div>
      )}

      {/* STEP 4/5: AI COMPLETION */}
      {step === 4 && mode === 'ai' && (
        <div style={{ textAlign: 'center', padding: '64px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <RefreshCw size={48} color="var(--color-primary)" className="spin" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Organizing Drive...</h2>
        </div>
      )}

      {step === 5 && mode === 'ai' && (
        <div style={{ textAlign: 'center', padding: '64px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Check size={32} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>All Done!</h2>
          <button onClick={() => setStep(1)} style={{ background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '8px 16px', borderRadius: '6px', marginTop: '24px', cursor: 'pointer' }}>Scan Again</button>
        </div>
      )}

      {/* FILE DETAILS & SMART INBOX TRIAGE MODAL */}
      {activeFile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{ background: 'var(--bg-main)', width: '100%', maxWidth: '480px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="var(--color-primary)" /> File Details
              </h3>
              <button onClick={() => setActiveFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', background: 'var(--bg-main)', maxHeight: '70vh', overflowY: 'auto' }}>
              
              {activeFile.webViewLink && (
                <a href={activeFile.webViewLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'var(--hover-color)', color: 'var(--color-primary)', textDecoration: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--border-color)' }}>
                  <Eye size={16} /> Open Preview in New Tab
                </a>
              )}

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>File Name</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px' }}>
                  <Edit2 size={16} color="var(--text-secondary)" style={{ marginRight: '8px', flexShrink: 0 }} />
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-panel)' }}>
              <button onClick={() => setActiveFile(null)} disabled={isRenaming} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
              <button 
                onClick={executeSaveModal} 
                disabled={isRenaming}
                style={{ padding: '10px 20px', background: 'var(--color-primary)', border: 'none', borderRadius: '8px', color: 'var(--color-primary-text)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isRenaming ? <RefreshCw size={16} className="spin" /> : <Check size={16} />}
                Save File Details
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
