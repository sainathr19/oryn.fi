import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { erc721Abi } from 'viem';
import { readContract } from 'viem/actions';

// Types for NFT data
export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  [key: string]: any;
}

export interface NFT {
  contractAddress: string;
  tokenId: string;
  tokenURI?: string;
  metadata: NFTMetadata | null;
  name?: string;
  symbol?: string;
}

export interface NFTContract {
  address: string;
  balance: bigint;
  nfts: NFT[];
  isLoading: boolean;
  error?: Error;
}

export interface UseNFTReturn {
  nftContracts: NFTContract[];
  isLoading: boolean;
  error: Error | null;
  fetchNfts: () => void;
  fetchMetadata: (tokenURI: string) => Promise<NFTMetadata | null>;
  refetch: () => void;
}

// Common NFT contract addresses
const NFT_CONTRACTS = [
  "0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4",
  // Add more NFT contract addresses as needed
];

export const useNFT = (): UseNFTReturn => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [nftContracts, setNftContracts] = useState<NFTContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);
  const hasLoggedRef = useRef(false);
  const lastAddressRef = useRef<string | null>(null);

  // console.log("Ada", walletClient)

  // Fetch metadata from tokenURI
  const fetchMetadata = async (tokenURI: string): Promise<NFTMetadata | null> => {
    try {
      // Handle IPFS URLs
      const url = tokenURI.startsWith('ipfs://') 
        ? `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
        : tokenURI;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching NFT metadata:', err);
      return null;
    }
  };

  // This function will be used to fetch individual NFT details when needed
  // For now, we'll focus on getting the balance first

  // Fetch NFT balance using direct contract call
  const fetchNFTBalance = useCallback(async (contractAddress: string): Promise<NFTContract> => {
    const contract: NFTContract = {
      address: contractAddress,
      balance: 0n,
      nfts: [],
      isLoading: true,
    };

    try {
      if (!walletClient) {
        throw new Error('No wallet client available');
      }

      const balance = await readContract(walletClient, {
        address: contractAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: 'balanceOf',
        args: [address!],
      });

      contract.balance = balance as bigint;
      contract.isLoading = false;

      return contract;
    } catch (err) {
      contract.isLoading = false;
      contract.error = err as Error;
      return contract;
    }
  }, [address, walletClient]);

  // Process NFT contracts when shouldFetch is true
  useEffect(() => {
    if (!shouldFetch || !isConnected || !address || !walletClient) {
      return;
    }

    // Reset logging flag if address changed
    if (lastAddressRef.current !== address) {
      hasLoggedRef.current = false;
      lastAddressRef.current = address;
    }

    // Don't process if we already logged for this address
    if (hasLoggedRef.current) {
      return;
    }

    const fetchAllNFTs = async () => {
      setIsLoading(true);
      const contracts: NFTContract[] = [];

      // Fetch NFTs from each contract
      for (const contractAddress of NFT_CONTRACTS) {
        const contract = await fetchNFTBalance(contractAddress);
        contracts.push(contract);
      }

      setNftContracts(contracts);
      setIsLoading(false);
      hasLoggedRef.current = true; // Mark as logged
      
      // Log summary only once when data is complete
      const totalNFTs = contracts.reduce((sum, contract) => sum + Number(contract.balance), 0);
      console.log(`✅ Found ${totalNFTs} NFTs from ${contracts.length} contracts`);
      
      contracts.forEach(contract => {
        if (contract.balance > 0n) {
          console.log(`📦 Contract ${contract.address}: ${contract.balance.toString()} NFTs`);
        } else if (contract.error) {
          console.log(`❌ Contract ${contract.address}: ${contract.error.message}`);
        }
      });
    };

    fetchAllNFTs();
  }, [shouldFetch, isConnected, address, walletClient, fetchNFTBalance]);

  // Main fetch function
  const fetchNfts = useCallback(() => {
    if (!isConnected || !address) {
      console.log('Wallet not connected');
      return;
    }

    console.log('Fetching NFTs for address:', address);
    hasLoggedRef.current = false; // Reset logging flag for new fetch
    setShouldFetch(true);
  }, [isConnected, address]);

  // Refetch function
  const refetch = useCallback(() => {
    fetchNfts();
  }, [fetchNfts]);

  // Auto-fetch NFTs when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchNfts();
    }
  }, [isConnected, address, fetchNfts]);

  return {
    nftContracts,
    isLoading,
    error,
    fetchMetadata, 
    fetchNfts,
    refetch,
  };
};
