import { PYTH_NETWORK_CONFIG } from '../utils/constants';

// Type definitions for the Pyth Network API response
interface PythNetworkApiResponse {
  binary: {
    encoding: string;
    data: string[];
  };
  parsed: Array<{
    id: string;
    price: {
      price: string;
      conf: string;
      expo: number;
      publish_time: number;
    };
    ema_price: {
      price: string;
      conf: string;
      expo: number;
      publish_time: number;
    };
    metadata: {
      slot: number;
      proof_available_time: number;
      prev_publish_time: number;
    };
  }>;
}

/**
 * Fetches price data from Pyth Network API and returns the binary data string
 * @returns Promise<string> - The binary data string from the API response
 */
export async function fetchPythPriceData(): Promise<string> {
  try {
    // Build query parameters for the API request
    const queryParams = PYTH_NETWORK_CONFIG.PRICE_FEED_IDS.map(id => `ids[]=${id}`).join('&');
    const apiUrl = `${PYTH_NETWORK_CONFIG.API_BASE_URL}?${queryParams}`;

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Parse the JSON response
    const data = await response.json() as PythNetworkApiResponse;
    
    // Extract and return the binary data string
    if (data.binary && data.binary.data && data.binary.data.length > 0) {
      const binaryData = data.binary.data[0];
      if (binaryData) {
        return binaryData; // Return the first binary data string
      }
    }
    throw new Error('No binary data found in response');
    
  } catch (error) {
    console.error('Error fetching prices:', error);
    throw error;
  }
}
