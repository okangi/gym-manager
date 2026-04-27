const config = {
  apiUrl: import.meta.env.VITE_API_URL || 
          (import.meta.env.PROD 
            ? 'https://gym-backend.onrender.com/api' 
            : 'http://localhost:5000/api'),
  appName: import.meta.env.VITE_APP_NAME || 'Gym Manager',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
};

export default config;
