// Production environment configuration
export const environment = {
  production: true,
  // In production, set your hardcoded domain or API endpoint
  // Or it will be derived from the current window.location
  urlBase: 'https://',
  apiBaseUrl: 'music-player.hu',
  // apiBaseUrl: 'https://api.yourdomain.com', // Uncomment and set your production domain
  apiPort: 8080,
};
