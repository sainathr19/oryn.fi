import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { erc721Abi } from 'viem';
import { readContract } from 'viem/actions';
import { contractAddresses } from '../constants/constants';

// Types for NFT data
export interface NFT {
  contractAddress: string;
  tokenId: string;
}

export interface NFTContract {
  address: string;
  balance: bigint;
  tokenIds: string[];
  isLoading: boolean;
  error?: Error;
}

export interface UseNFTReturn {
  nftContracts: NFTContract[];
  isLoading: boolean;
  error: Error | null;
  fetchNfts: () => void;
  refetch: () => void;
}

export const useNFT = (): UseNFTReturn => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [nftContracts, setNftContracts] = useState<NFTContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);
  const hasLoggedRef = useRef(false);
  const lastAddressRef = useRef<string | null>(null);

const fetchNFTData = useCallback(async (contractAddress: string): Promise<NFTContract> => {
  const contract: NFTContract = {
    address: contractAddress,
    balance: 0n,
    tokenIds: [],
    isLoading: true,
  };

  try {
    if (!walletClient || !address) throw new Error("No wallet client or address");

    // 1. Get balance
    const balance = await readContract(walletClient, {
      address: contractAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: "balanceOf",
      args: [address],
    });
    contract.balance = balance as bigint;

    // 2. Try enumerable first
    const ids: string[] = [];
    for (let i = 0n; i < contract.balance; i++) {
      try {
        const tokenId = await readContract(walletClient, {
          address: contractAddress as `0x${string}`,
          abi: [
            ...erc721Abi,
            {
              type: "function",
              name: "tokenOfOwnerByIndex",
              stateMutability: "view",
              inputs: [
                { name: "owner", type: "address" },
                { name: "index", type: "uint256" },
              ],
              outputs: [{ name: "tokenId", type: "uint256" }],
            },
          ],
          functionName: "tokenOfOwnerByIndex",
          args: [address, i],
        });
        ids.push((tokenId as bigint).toString());
      } catch {
        // enumerable not supported → fallback
      }
    }

    // 3. If no IDs, fallback to scanning Transfer events (requires viem getLogs)
    if (ids.length === 0 && contract.balance > 0n) {
      console.warn("Enumerable not supported. Need to fetch from Transfer logs or contract-specific function.");
      // Option A: use getLogs with topic filter Transfer(address, address, tokenId)
      // Option B: call positions(tokenId) if ABI supports it
    }

    contract.tokenIds = ids;
    contract.isLoading = false;
    return contract;
  } catch (err) {
    contract.isLoading = false;
    contract.error = err as Error;
    return contract;
  }
}, [address, walletClient]);


  // Process NFT contracts
  useEffect(() => {
    if (!shouldFetch || !isConnected || !address || !walletClient) return;

    if (lastAddressRef.current !== address) {
      hasLoggedRef.current = false;
      lastAddressRef.current = address;
    }
    if (hasLoggedRef.current) return;

    const fetchAllNFTs = async () => {
      setIsLoading(true);
      const contracts: NFTContract[] = [];

      for (const contractAddress of contractAddresses.ORYN_ENGINE_ADDRESS_V3) {
        const contract = await fetchNFTData(contractAddress);
        contracts.push(contract);
      }

      setNftContracts(contracts);
      setIsLoading(false);
      hasLoggedRef.current = true;

      // Log results
      contracts.forEach(contract => {
        if (contract.balance > 0n) {
          console.log(`📦 Contract ${contract.address}: ${contract.balance.toString()} NFTs`);
          console.log(`🆔 Token IDs:`, contract.tokenIds);
        } else if (contract.error) {
          console.log(`❌ Contract ${contract.address}: ${contract.error.message}`);
        }
      });
    };

    fetchAllNFTs();
  }, [shouldFetch, isConnected, address, walletClient, fetchNFTData]);

  // Main fetch trigger
  const fetchNfts = useCallback(() => {
    if (!isConnected || !address) {
      console.log('Wallet not connected');
      return;
    }
    console.log('Fetching NFTs for address:', address);
    hasLoggedRef.current = false;
    setShouldFetch(true);
  }, [isConnected, address]);

  const refetch = useCallback(() => {
    fetchNfts();
  }, [fetchNfts]);

  // Auto-fetch when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchNfts();
    }
  }, [isConnected, address, fetchNfts]);

  return {
    nftContracts,
    isLoading,
    error,
    fetchNfts,
    refetch,
  };
};