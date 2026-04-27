import { getGymSettings } from '../services/gymSettingsService';

// Cache for currency symbol
let cachedCurrencySymbol = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Async version - fetches from backend
export const getCurrencySymbol = async () => {
  const now = Date.now();
  
  // Return cached value if still valid
  if (cachedCurrencySymbol !== null && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedCurrencySymbol;
  }
  
  try {
    const settings = await getGymSettings();
    cachedCurrencySymbol = settings.currencySymbol || '$';
    lastFetchTime = now;
    return cachedCurrencySymbol;
  } catch (error) {
    console.error('Error fetching currency symbol:', error);
    return cachedCurrencySymbol || '$';
  }
};

// Sync version for components that need immediate value (uses cached or default)
export const getCurrencySymbolSync = () => {
  return cachedCurrencySymbol || '$';
};

// Preload currency symbol
export const preloadCurrencySymbol = async () => {
  return await getCurrencySymbol();
};