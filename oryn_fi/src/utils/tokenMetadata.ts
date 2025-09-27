interface TokenConfig {
  name: string;
  decimals: number;
  symbol: string;
  logo: string;
  tokenAddress: string;
}

interface ChainConfig {
  chainId: string;
  networkLogo: string;
  explorer: string;
  networkType: string;
  name: string;
  assetConfig: TokenConfig[];
}

interface TokenMetadataResponse {
  success: boolean;
  data: {
    chains: Record<string, ChainConfig>;
  };
}

export const fetchTokenMetadata = async (): Promise<TokenMetadataResponse> => {
  const response = await fetch('https://u8ks0g4k0ogg4gww8cc48wow.staging.btcfi.wtf/assets');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch token metadata: ${response.statusText}`);
  }
  
  return response.json();
};

export const findTokenByAddress = (
  tokenAddress: string,
  metadata: TokenMetadataResponse
): TokenConfig | null => {
  // Convert to lowercase for case-insensitive comparison
  const searchAddress = tokenAddress.toLowerCase();
  
  for (const chain of Object.values(metadata.data.chains)) {
    const token = chain.assetConfig.find(
      (token) => token.tokenAddress.toLowerCase() === searchAddress
    );
    if (token) {
      return token;
    }
  }
  
  return null;
};

export const formatUSDValue = (value: bigint, decimals: number = 18): string => {
  const divisor = BigInt(10 ** decimals);
  const wholePart = value / divisor;
  const fractionalPart = value % divisor;
  
  if (fractionalPart === 0n) {
    return `$${wholePart.toString()}`;
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  // Limit to 5 decimal places
  const limitedFractional = fractionalStr.substring(0, 5);
  const trimmedFractional = limitedFractional.replace(/0+$/, '');
  
  if (trimmedFractional === '') {
    return `$${wholePart.toString()}`;
  }
  
  return `$${wholePart.toString()}.${trimmedFractional}`;
};
