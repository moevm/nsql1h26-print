import axiosInstance from './axios';

export const databaseApi = {
  async exportDatabase(saveOnServer = false) {
    const response = await axiosInstance.get('/database/export', {
      params: { save_on_server: saveOnServer },
      responseType: 'blob',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'export.json';
    const serverPath = response.headers['x-export-server-path'];
    const nodesCount = response.headers['x-export-nodes-count'];
    const relationshipsCount = response.headers['x-export-relationships-count'];
    
    return {
      blob: response.data,
      filename,
      serverPath,
      nodesCount: nodesCount ? parseInt(nodesCount) : 0,
      relationshipsCount: relationshipsCount ? parseInt(relationshipsCount) : 0
    };
  },

  async importDatabase(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axiosInstance.post('/database/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    return response.data;
  },

  async getImportExportLogs(params = {}) {
    const response = await axiosInstance.get('/database/logs', {
      params: {
        limit: params.limit ?? 10,
        offset: params.offset ?? 0,
        operation_type: params.operationType,
        status: params.status
      }
    });
    return response.data;
  }
};