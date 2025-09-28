export interface Asset {
    name: string;
    decimals: number;
    symbol: string;
    logo: string;
    tokenAddress: string;
    chainKey?: string;
    chainName?: string;
    chainLogo?: string;
    chainId?: string;
}

export interface Chain {
    chainId: string;
    networkLogo: string;
    explorer: string;
    networkType: string;
    name: string;
    assetConfig: Asset[];
}

export interface ChainsResponse {
    success: boolean;
    data: {
        chains: Record<string, Chain>;
    };
}

export interface AssetsResponse {
    success: boolean;
    data: Asset[];
}
