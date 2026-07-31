// Mock fileMeta service

const metas = new Map();

export const fileMetaService = {
  getMeta: (fileId) => {
    return metas.get(fileId) || {
      isProcessed: false,
      projectId: null,
      taskId: null,
      tags: []
    };
  },
  
  setMeta: (fileId, meta) => {
    const existing = metas.get(fileId) || {};
    metas.set(fileId, { ...existing, ...meta });
  }
};
