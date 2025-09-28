import { PYTH_NETWORK_CONFIG, ORACLE_CONFIG } from '../utils/constants';

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
  const { API_TIMEOUT_MS } = ORACLE_CONFIG;
  
  try {
    console.log('[PythService] Starting to fetch price data from Pyth Network...');
    
    // Build query parameters for the API request
    const queryParams = PYTH_NETWORK_CONFIG.PRICE_FEED_IDS.map(id => `ids[]=${id}`).join('&');
    const apiUrl = `${PYTH_NETWORK_CONFIG.API_BASE_URL}?${queryParams}`;
    
    console.log(`[PythService] API URL: ${apiUrl}`);
    console.log(`[PythService] Price feed IDs: ${PYTH_NETWORK_CONFIG.PRICE_FEED_IDS.join(', ')}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pyth-Oracle-Service/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    console.log(`[PythService] HTTP response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    // Parse the JSON response
    console.log('[PythService] Parsing JSON response...');
    const data = await response.json() as PythNetworkApiResponse;
    
    console.log(`[PythService] Response structure: binary=${!!data.binary}, data.length=${data.binary?.data?.length || 0}`);
    
    // Extract and return the binary data string
    if (data.binary && data.binary.data && data.binary.data.length > 0) {
      const binaryData = data.binary.data[0];
      if (binaryData) {
        console.log(`[PythService] Successfully extracted binary data (length: ${binaryData.length})`);
        return binaryData; // Return the first binary data string
      }
    }
    throw new Error('No binary data found in response');
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[PythService] API request timed out after ${API_TIMEOUT_MS}ms`);
      throw new Error(`API request timed out after ${API_TIMEOUT_MS}ms`);
    }
    console.error('[PythService] Error fetching prices:', error);
    throw error;
  }
}
