import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getBaseUrl, setBaseUrl } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('textile_theme') || 'light');
  const [apiUrl, setApiUrlState] = useState(getBaseUrl());
  const [toasts, setToasts] = useState([]);
  
  // Cached Master Data
  const [parties, setParties] = useState([]);
  const [fabricOrders, setFabricOrders] = useState([]);
  const [tickits, setTickits] = useState([]);
  const [yarnCounts, setYarnCounts] = useState([]);
  const [sizingUnits, setSizingUnits] = useState([]);
  const [yarnStorageLocations, setYarnStorageLocations] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('textile_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const updateApiUrl = (newUrl) => {
    setBaseUrl(newUrl);
    setApiUrlState(newUrl);
    addToast('API base URL updated', 'info');
    refreshMasters();
  };

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const refreshMasters = async () => {
    setLoadingMasters(true);
    try {
      const [partiesRes, ordersRes, tickitsRes, countsRes, sizingRes, storageLocationsRes] = await Promise.allSettled([
        api.parties.getAll(),
        api.fabricOrders.getAll(),
        api.tickits.getAll(),
        api.yarnCounts.getAll(),
        api.sizingUnits.getAll(),
        api.yarnStorageLocations.getAll(),
      ]);

      if (partiesRes.status === 'fulfilled' && Array.isArray(partiesRes.value)) {
        setParties(partiesRes.value);
      }
      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
        setFabricOrders(ordersRes.value);
      }
      if (tickitsRes.status === 'fulfilled' && Array.isArray(tickitsRes.value)) {
        setTickits(tickitsRes.value);
      }
      if (countsRes.status === 'fulfilled' && Array.isArray(countsRes.value)) {
        setYarnCounts(countsRes.value);
      }
      if (sizingRes.status === 'fulfilled' && Array.isArray(sizingRes.value)) {
        setSizingUnits(sizingRes.value);
      }
      if (storageLocationsRes.status === 'fulfilled' && Array.isArray(storageLocationsRes.value)) {
        setYarnStorageLocations(storageLocationsRes.value);
      }
    } catch (error) {
      console.error('Failed to load master data:', error);
    } finally {
      setLoadingMasters(false);
    }
  };

  useEffect(() => {
    refreshMasters();
  }, [apiUrl]);

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        theme,
        toggleTheme,
        apiUrl,
        updateApiUrl,
        toasts,
        addToast,
        removeToast,
        parties,
        fabricOrders,
        tickits,
        yarnCounts,
        sizingUnits,
        yarnStorageLocations,
        loadingMasters,
        refreshMasters,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
