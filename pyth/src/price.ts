// Type definitions for the API response
interface PythApiResponse {
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

// Constant array of price feed IDs
const PRICE_FEED_IDS = [
  'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  '78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501',
  'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a'
];

/**
 * Fetches price data from Pyth Network API and returns the binary data string
 * @returns Promise<string> - The binary data string from the API response
 */
export async function fetchPythPriceData(): Promise<string> {
  try {
    // Build query parameters for the API request
    const queryParams = PRICE_FEED_IDS.map(id => `ids[]=${id}`).join('&');
    const apiUrl = `https://hermes.pyth.network/v2/updates/price/latest?${queryParams}`;

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Parse the JSON response
    const data = await response.json() as PythApiResponse;
    
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
