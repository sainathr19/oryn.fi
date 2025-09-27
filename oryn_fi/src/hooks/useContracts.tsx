import { useState, useCallback, useMemo } from "react";
import { contractAddresses } from "../constants/constants";
import { ORYN_V3_ABI } from "../constants/abi/OrynV3";
import { POSITION_MANAGET_ABI } from "../constants/abi/PositionManager";
import { useAccount, useWalletClient } from "wagmi";
import { getContract, type Client } from "viem";

export const useContracts = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const orynContract = useMemo(() => {
    if (!walletClient) {
      return null;
    }
    return getContract({
      abi: ORYN_V3_ABI, 
      address: contractAddresses.ORYN_ENGINE_ADDRESS_V3,
      client: walletClient as Client,
    });
  }, [walletClient]);

  const positionManagerContract = useMemo(() => {
    if (!walletClient) {
      return null;
    }
    return getContract({
      abi: POSITION_MANAGET_ABI,
      address: contractAddresses.UNI_V3_POSITION_MANAGER_ADDRESS,
      client: walletClient as Client,
    });
  }, [walletClient]);

  const [userPositions, setUserPositions] = useState<any>(null);
  const [userTokenIds, setUserTokenIds] = useState<number[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [nftError, setNftError] = useState<Error | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingAllDetails, setIsLoadingAllDetails] = useState(false);

  const fetchUserPositions = useCallback(async () => {
    if (!orynContract || !address) {
      console.warn("Oryn contract or address not available");
      return;
    }
    
    try {
      const result = await orynContract.read.getUserPositions([address as `0x${string}`]);
      setUserPositions(result);
      console.log("User positions:", result)
      setError(null);
    } catch (err) {
      setError(err as Error);
      setUserPositions(null);
      console.error("Failed to fetch user positions:", err);
    }
  }, [orynContract, address]);

  const fetchUserNFTs = useCallback(async () => {
    if (!positionManagerContract || !address) {
      console.warn("Position manager contract or address not available");
      return;
    }

    setIsLoadingNFTs(true);
    setNftError(null);
    setUserTokenIds([]);

    try {
      // First, get the balance (total number of NFTs owned by the user)
      const balance = await positionManagerContract.read.balanceOf([address as `0x${string}`]) as bigint;
      console.log("User NFT balance:", balance.toString());

      if (balance === 0n) {
        console.log("User has no NFTs");
        setIsLoadingNFTs(false);
        return;
      }

      // Fetch all token IDs by calling tokenOfOwnerByIndex for each index
      const tokenIds: number[] = [];
      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await positionManagerContract.read.tokenOfOwnerByIndex([
            address as `0x${string}`,
            BigInt(i)
          ]) as bigint;
          tokenIds.push(Number(tokenId));
        } catch (err) {
          console.error(`Failed to fetch token at index ${i}:`, err);
        }
      }

      setUserTokenIds(tokenIds);
      console.log("User token IDs:", tokenIds);
      setIsLoadingNFTs(false);
    } catch (err) {
      setNftError(err as Error);
      setUserTokenIds([]);
      setIsLoadingNFTs(false);
      console.error("Failed to fetch user NFTs:", err);
    }
  }, [positionManagerContract, address]);

  const fetchNFTPositionDetails = useCallback(async (tokenId: number) => {
    if (!orynContract) {
      console.warn("Oryn contract not available");
      return;
    }

    try {
      const details = await orynContract.read.getNFTPositionDetails([BigInt(tokenId)]) as [
        string, string, number, bigint, bigint, bigint, bigint
      ];
      
      const positionDetails = {
        token0: details[0],
        token1: details[1],
        fee: details[2],
        liquidity: details[3],
        totalValueUSD: details[4],
        principalValueUSD: details[5],
        feeValueUSD: details[6],
      };

      console.log("NFT Position Details:", positionDetails);
      return positionDetails;
    } catch (err) {
      console.error("Failed to fetch NFT position details:", err);
      throw err;
    }
  }, [orynContract]);

  const fetchAllNFTDetails = useCallback(async (tokenIds: number[]) => {
    if (!orynContract || tokenIds.length === 0) {
      return;
    }

    setIsLoadingAllDetails(true);
    
    try {
      // Import the utility functions
      const { fetchTokenMetadata, findTokenByAddress } = await import('../utils/tokenMetadata');
      
      // Fetch token metadata once
      const metadataResponse = await fetchTokenMetadata();
      
      // Fetch details for all NFTs in parallel
      const detailPromises = tokenIds.map(async (tokenId) => {
        try {
          const positionDetails = await fetchNFTPositionDetails(tokenId);
          if (positionDetails) {
            const token0Metadata = findTokenByAddress(positionDetails.token0, metadataResponse);
            const token1Metadata = findTokenByAddress(positionDetails.token1, metadataResponse);
            
            if (token0Metadata && token1Metadata) {
              // Import the store to update it
              const { useNFTStore } = await import('../stores/nftStore');
              useNFTStore.getState().setAllNFTDetails(tokenId, positionDetails, token0Metadata, token1Metadata);
              
              return {
                tokenId,
                positionDetails,
                token0Metadata,
                token1Metadata,
              };
            }
          }
        } catch (err) {
          console.error(`Failed to fetch details for token ${tokenId}:`, err);
        }
        return null;
      });

      const results = await Promise.all(detailPromises);
      return results.filter(result => result !== null);
    } catch (err) {
      console.error("Failed to fetch all NFT details:", err);
    } finally {
      setIsLoadingAllDetails(false);
    }
  }, [orynContract, fetchNFTPositionDetails]);

  // Optionally, call fetchUserPositions when needed, e.g. in a useEffect

  


  return {
    fetchUserPositions,
    fetchUserNFTs,
    fetchNFTPositionDetails,
    fetchAllNFTDetails,
    userPositions,
    userTokenIds,
    isLoadingNFTs,
    isLoadingAllDetails,
    nftError,
    error
  }
};
