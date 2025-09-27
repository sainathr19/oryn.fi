import { useState, useEffect } from 'react';
import { API } from '../constants/api';
import type { Asset, Chain, ChainsResponse } from '../types/assets';

export const useAssets = (chainName?: string) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [chains, setChains] = useState<Record<string, Chain>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                setLoading(true);
                setError(null);

                const api = API();
                const response = await fetch(api.assets);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: ChainsResponse = await response.json();

                if (data.success && data.data?.chains) {
                    setChains(data.data.chains);

                    // Only show USDC (OUSDC) assets
                    const usdcAssets: Asset[] = [];
                    Object.values(data.data.chains).forEach(chain => {
                        const usdcAsset = chain.assetConfig.find(asset => asset.symbol === 'USDC');
                        if (usdcAsset) {
                            usdcAssets.push(usdcAsset);
                        }
                    });
                    setAssets(usdcAssets);
                } else {
                    throw new Error('Failed to fetch chains data');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                console.error('Error fetching assets:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
    }, [chainName]);

    return { assets, chains, loading, error };
};
