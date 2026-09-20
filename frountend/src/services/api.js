const DEFAULT_BASE_URL = 'http://localhost:8080';

export const getBaseUrl = () => {
  return localStorage.getItem('textile_api_url') || DEFAULT_BASE_URL;
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

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.message) errorMessage = errJson.message;
      } catch (e) {
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
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

  // Yarn Inward API
  yarnInward: {
    getAll: () => request('/api/yarn-inward'),
    getById: (id) => request(`/api/yarn-inward/${id}`),
    getBySupplier: (supplierId) => request(`/api/yarn-inward/supplier/${supplierId}`),
    getByOrder: (orderId) => request(`/api/yarn-inward/order/${orderId}`),
    getByPaymentStatus: (status) => request(`/api/yarn-inward/payment-status/${status}`),
    create: (data) => request('/api/yarn-inward', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/yarn-inward/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/yarn-inward/${id}`, { method: 'DELETE' }),
  },

  // Yarn Out For Sizing API
  yarnOutSizing: {
    getAll: () => request('/api/yarn-out-sizing'),
    getById: (id) => request(`/api/yarn-out-sizing/${id}`),
    getBySizingSet: (sizingSetId) => request(`/api/yarn-out-sizing/sizing-set/${sizingSetId}`),
    create: (data) => request('/api/yarn-out-sizing', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/yarn-out-sizing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/yarn-out-sizing/${id}`, { method: 'DELETE' }),
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
    create: (data) => request('/api/sizing-sets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/sizing-sets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/sizing-sets/${id}`, { method: 'DELETE' }),
  },

  // Beam Inward API (Teammate's changes)
  beamInward: {
    getAll: () => request('/api/beam-inward'),
    getById: (id) => request(`/api/beam-inward/${id}`),
    create: (data) => request('/api/beam-inward', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/beam-inward/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/beam-inward/${id}`, { method: 'DELETE' }),
  },

  // Yarn Out For Dyeing API (Your changes)
  yarnOutDyeing: {
    getAll: () => request('/api/yarn-out-dyeing'),
    getById: (id) => request(`/api/yarn-out-dyeing/${id}`),
    create: (data) => request('/api/yarn-out-dyeing', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/yarn-out-dyeing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/yarn-out-dyeing/${id}`, { method: 'DELETE' }),
  },
};