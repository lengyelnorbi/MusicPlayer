// Development environment configuration
export const environment = {
  production: false,
  // In development, detect the hostname and use it for API
  // If accessed from 192.168.1.3:4200, API will be at 192.168.1.3:8080
  urlBase: 'http://',
  apiBaseUrl: '10.199.87.26', // Will be set dynamically in ApiConfigService based on current hostname
  // If accessed from localhost:4200, API will be at localhost:8080
  apiPort: 8080,
};
