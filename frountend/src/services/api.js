const DEFAULT_BASE_URL = 'http://localhost:8080';
const LEGACY_BASE_URL = 'http://localhost:8081';

export const getBaseUrl = () => {
  const savedUrl = localStorage.getItem('textile_api_url');
  return savedUrl === LEGACY_BASE_URL ? DEFAULT_BASE_URL : (savedUrl || DEFAULT_BASE_URL);
};

export const setBaseUrl = (url) => {
  localStorage.setItem('textile_api_url', url);
};

const request = async (endpoint, options = {}) => {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const url = `${baseUrl}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  const token = sessionStorage.getItem('textile_access_token');
  if (token && endpoint !== '/api/auth/login') {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const responseText = response.status === 204 ? '' : await response.text();
    let responseData = responseText;
    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        // Several endpoints return plain-text success and error messages.
        responseData = responseText;
      }
    }

    if (!response.ok) {
      if (response.status === 401 && endpoint !== '/api/auth/login') {
        sessionStorage.removeItem('textile_access_token');
        window.dispatchEvent(new Event('textile-auth-expired'));
      }
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (responseData && typeof responseData === 'object' && responseData.message) errorMessage = responseData.message;
      else if (typeof responseData === 'string' && responseData) errorMessage = responseData;
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
  auth: {
    login: (email, password) => request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  },

  // Parties API
  parties: {
    getAll: () => request('/api/parties'),
    getById: (id) => request(`/api/parties/${id}`),
    create: (data) => request('/api/parties', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/parties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/parties/${id}`, { method: 'DELETE' }),
  },

  // Fabric Orders API
  fabricOrders: {
    getAll: () => request('/api/fabric-orders'),
    getById: (id) => request(`/api/fabric-orders/${id}`),
    getByParty: (partyId) => request(`/api/fabric-orders/party/${partyId}`),
    getByStatus: (status) => request(`/api/fabric-orders/status/${status}`),
    create: (data) => request('/api/fabric-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/fabric-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/fabric-orders/${id}`, { method: 'DELETE' }),
  },

  // Tickits API
  tickits: {
    getAll: () => request('/api/tickits'),
    getById: (id) => request(`/api/tickits/${id}`),
    getByParty: (partyId) => request(`/api/tickits/party/${partyId}`),
    create: (data) => request('/api/tickits', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/tickits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/tickits/${id}`, { method: 'DELETE' }),
  },

  // Yarn Counts API
  yarnCounts: {
    getAll: () => request('/api/yarn-counts'),
    getById: (id) => request(`/api/yarn-counts/${id}`),
    create: (data) => request('/api/yarn-counts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/yarn-counts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/yarn-counts/${id}`, { method: 'DELETE' }),
  },

  // Sizing Units API
  sizingUnits: {
    getAll: () => request('/api/sizing-units'),
    getById: (id) => request(`/api/sizing-units/${id}`),
    getByParty: (partyId) => request(`/api/sizing-units/party/${partyId}`),
    create: (data) => request('/api/sizing-units', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/sizing-units/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/sizing-units/${id}`, { method: 'DELETE' }),
  },

  // Yarn storage locations API
  yarnStorageLocations: {
    getAll: () => request('/api/yarn-storage-locations'),
  },

  // Yarn Inward API
  yarnInward: {
    getAll: () => request('/api/yarn-inward'),
    getById: (id) => request(`/api/yarn-inward/${id}`),
    getBySupplier: (supplierId) => request(`/api/yarn-inward/supplier/${supplierId}`),
    getByOrder: (orderId) => request(`/api/yarn-inward/order/${orderId}`),
    create: (data) => request('/api/yarn-inward', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/yarn-inward/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/yarn-inward/${id}`, { method: 'DELETE' }),
  },


  // Sizing Yarn Inward API
  sizingYarnInward: {
    getAll: () => request('/api/sizing-yarn-inward'),
    getById: (id) => request(`/api/sizing-yarn-inward/${id}`),
    getBySizingSet: (sizingSetId) => request(`/api/sizing-yarn-inward/sizing-set/${sizingSetId}`),
    getByOrder: (orderId) => request(`/api/sizing-yarn-inward/order/${orderId}`),
    getBySizingUnit: (sizingId) => request(`/api/sizing-yarn-inward/sizing-unit/${sizingId}`),
    getByParty: (partyId) => request(`/api/sizing-yarn-inward/party/${partyId}`),
    create: (data) => request('/api/sizing-yarn-inward', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/sizing-yarn-inward/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/sizing-yarn-inward/${id}`, { method: 'DELETE' }),
  },

  // Sizing Sets API
  sizingSets: {
    getAll: () => request('/api/sizing-sets'),
    getById: (id) => request(`/api/sizing-sets/${id}`),
    getInwardLookup: (id) => request(`/api/sizing-sets/${id}/inward-lookup`),
    nextSetNo: () => request('/api/sizing-sets/next-set-no'),
    create: (data) => request('/api/sizing-sets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/sizing-sets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/sizing-sets/${id}`, { method: 'DELETE' }),
  },

  fabricOrderDetails: {
    getByOrderNo: (orderNo) => request(`/api/orders/${encodeURIComponent(orderNo)}/details`),
  },

  gatePasses: {
    getActiveYarn: () => request('/api/gate-passes/active-yarn'),
  },

  rewindingIssues: {
    getAll: () => request('/api/rewinding-issues'),
    getById: (id) => request(`/api/rewinding-issues/${id}`),
    getByGetpassNo: (getpassNo) => request(`/api/rewinding-issues/getpass/${encodeURIComponent(getpassNo)}`),
    create: (data) => request('/api/rewinding-issues', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/rewinding-issues/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/rewinding-issues/${id}`, { method: 'DELETE' }),
  },

  rewindingYarnReceive: {
    getIssue: (getpassNo) => request(`/api/rewinding-yarn-receive/issue/${encodeURIComponent(getpassNo)}`),
    getByGetpass: (getpassNo) => request(`/api/rewinding-yarn-receive/${encodeURIComponent(getpassNo)}`),
    complete: (data) => request('/api/rewinding-yarn-receive/complete', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Beam Inward API
  beamInward: {
    getAll: () => request('/api/beam-inward'),
    getById: (id) => request(`/api/beam-inward/${id}`),
    getNextInwardNo: () => request('/api/beam-inward/next-inward-no'),
    getByInwardNo: (inwardNo) => request(`/api/beam-inward/inward-no/${encodeURIComponent(inwardNo)}`),
    getByOrder: (orderId) => request(`/api/beam-inward/order/${orderId}`),
    getBySizingSet: (sizingSetId) => request(`/api/beam-inward/sizing-set/${sizingSetId}`),
    create: (data) => request('/api/beam-inward', { method: 'POST', body: JSON.stringify(data) }),
    createBatch: (data) => request('/api/beam-inward/batch', { method: 'POST', body: JSON.stringify(data) }),
    complete: (data) => request('/api/beam-inward/complete', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/beam-inward/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/beam-inward/${id}`, { method: 'DELETE' }),
  },



  // Yarn Out For Dyeing API (Your changes)
  yarnOutDyeing: {
    getAll: () => request('/api/yarn-out-dyeing'),
    getById: (id) => request(`/api/yarn-out-dyeing/${id}`),
    create: (data) => request('/api/yarn-out-dyeing', { method: 'POST', body: JSON.stringify(data) }),
    createBatch: (data) => request('/api/yarn-out-dyeing/batch', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/yarn-out-dyeing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/yarn-out-dyeing/${id}`, { method: 'DELETE' }),
  },

  yarnReceiveDyeing: {
    getAll: () => request('/api/yarn-receive-dyeing'),
    create: (data) => request('/api/yarn-receive-dyeing', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/yarn-receive-dyeing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/yarn-receive-dyeing/${id}`, { method: 'DELETE' }),
  },
};
