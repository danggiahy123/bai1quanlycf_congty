// API Configuration
export const FALLBACK_URLS = [
  'http://192.168.5.162:5000', // New IP address
  'http://localhost:5000',
  'http://10.0.2.2:5000', // Android emulator
  'http://127.0.0.1:5000'
];

export const DEFAULT_API_URL = 'http://192.168.5.162:5000';

// Function to try API calls with fallback
export const tryApiCall = async (endpoint: string, options: RequestInit) => {
  for (const url of FALLBACK_URLS) {
    try {
      console.log(`Trying to connect to: ${url}${endpoint}`);
      
      const fetchPromise = fetch(`${url}${endpoint}`, options);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      console.log(`Response from ${url}:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data, url };
      } else {
        const errorData = await response.json();
        console.log(`Error from ${url}:`, errorData);
      }
    } catch (error) {
      console.log(`Connection failed to ${url}:`, error.message);
    }
  }
  return { success: false, error: 'Không thể kết nối đến server' };
};
