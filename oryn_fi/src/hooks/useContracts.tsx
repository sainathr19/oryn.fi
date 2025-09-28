import { useState, useCallback, useMemo } from "react";
import { contractAddresses } from "../constants/constants";
import { ORYN_V3_ABI } from "../constants/abi/OrynV3";
import { POSITION_MANAGET_ABI } from "../constants/abi/PositionManager";
import { useAccount, useWalletClient } from "wagmi";
import { erc20Abi, getContract, type Client } from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

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

  const [orynUSDContractAddress, setOrynUSDContractAddress] = useState<`0x${string}` | null>(null);

  const [userPositions, setUserPositions] = useState<any>(null);
  const [userTokenIds, setUserTokenIds] = useState<number[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [nftError, setNftError] = useState<Error | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingAllDetails, setIsLoadingAllDetails] = useState(false);
  
  // Transaction state for depositUniPosition
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<Error | null>(null);
  const [lastDepositTxHash, setLastDepositTxHash] = useState<string | null>(null);
  
  // Transaction state for NFT approval
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<Error | null>(null);
  const [lastApprovalTxHash, setLastApprovalTxHash] = useState<string | null>(null);
  
  // Transaction state for mint/repay/redeem operations
  const [isMinting, setIsMinting] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [mintError, setMintError] = useState<Error | null>(null);
  const [repayError, setRepayError] = useState<Error | null>(null);
  const [redeemError, setRedeemError] = useState<Error | null>(null);
  const [lastMintTxHash, setLastMintTxHash] = useState<string | null>(null);
  const [lastRepayTxHash, setLastRepayTxHash] = useState<string | null>(null);
  const [lastRedeemTxHash, setLastRedeemTxHash] = useState<string | null>(null);
  
  // Transaction state for token approval
  const [isApprovingToken, setIsApprovingToken] = useState(false);
  const [tokenApprovalError, setTokenApprovalError] = useState<Error | null>(null);
  const [lastTokenApprovalTxHash, setLastTokenApprovalTxHash] = useState<string | null>(null);

  const fetchUserPositions = useCallback(async () => {
    if (!orynContract || !address) {
      console.warn("Oryn contract or address not available");
      return;
    }
    
    try {
      // First get the position IDs
      const positionIds = await orynContract.read.getUserPositions([address as `0x${string}`]) as bigint[];
      console.log("User position IDs:", positionIds);
      
      if (positionIds.length === 0) {
        setUserPositions([]);
        return;
      }
      
      // Then get the detailed position data
      const result = await orynContract.read.getUserPositionDetails([address as `0x${string}`]) as any[];
      console.log("User position details:", result);
      setUserPositions(result);
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

  // Function to get OrynUSD contract address
  const getOrynUSDContractAddress = useCallback(async (): Promise<`0x${string}`> => {
    if (!orynContract) {
      throw new Error("Oryn contract not available");
    }

    try {
      const address = await orynContract.read.getOrynUSDContractAddress([]) as `0x${string}`;
      setOrynUSDContractAddress(address);
      return address;
    } catch (err) {
      console.error("Failed to get OrynUSD contract address:", err);
      throw err;
    }
  }, [orynContract]);

  // Function to approve OrynUSD tokens
  const approveOrynUSD = useCallback(async (): Promise<string> => {
    if (!orynUSDContractAddress || !address || !walletClient) {
      throw new Error("OrynUSD contract address, wallet address, or wallet client not available");
    }

    setIsApprovingToken(true);
    setTokenApprovalError(null);
    setLastTokenApprovalTxHash(null);

    try {
      console.log(`Approving OrynUSD tokens for Oryn contract: ${contractAddresses.ORYN_ENGINE_ADDRESS_V3}`);
      
      // Approve with maximum uint256 value
      const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      
      const txHash = await writeContract(walletClient, {
        abi: erc20Abi,
        address: orynUSDContractAddress,
        functionName: 'approve',
        args: [contractAddresses.ORYN_ENGINE_ADDRESS_V3, maxUint256]
      });
      
      console.log("Token approval transaction submitted:", txHash);
      setLastTokenApprovalTxHash(txHash);
      
      // Wait for the transaction to be mined
      const receipt = await waitForTransactionReceipt(walletClient, { hash: txHash });
      
      if (receipt.status === 'success') {
        console.log("Token approval transaction confirmed:", receipt);
        return txHash;
      } else {
        throw new Error("Token approval transaction failed");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Failed to approve OrynUSD tokens:", error);
      setTokenApprovalError(error);
      throw error;
    } finally {
      setIsApprovingToken(false);
    }
  }, [orynUSDContractAddress, address, walletClient]);

  const approveNFT = useCallback(async (tokenId: number): Promise<string> => {
    if (!positionManagerContract || !address) {
      throw new Error("Position manager contract or address not available");
    }

    setIsApproving(true);
    setApprovalError(null);
    setLastApprovalTxHash(null);

    try {
      console.log(`Approving NFT token ID: ${tokenId} for Oryn contract: ${contractAddresses.ORYN_ENGINE_ADDRESS_V3}`);
      
      // Call the approve function on the position manager contract
      const txHash = await positionManagerContract.write.approve([
        contractAddresses.ORYN_ENGINE_ADDRESS_V3, // to address (Oryn contract)
        BigInt(tokenId) // tokenId
      ]);
      
      console.log("Approval transaction submitted:", txHash);
      setLastApprovalTxHash(txHash);
      
      // Wait for the transaction to be mined
      const receipt = await waitForTransactionReceipt(walletClient as Client, { hash: txHash });
      
      if (receipt.status === 'success') {
        console.log("Approval transaction confirmed:", receipt);
        return txHash;
      } else {
        throw new Error("Approval transaction failed");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Failed to approve NFT:", error);
      setApprovalError(error);
      throw error;
    } finally {
      setIsApproving(false);
    }
  }, [positionManagerContract, address, walletClient]);

  const depositUniPosition = useCallback(async (tokenId: number): Promise<{ positionId: bigint; txHash: string }> => {
    if (!orynContract || !address) {
      throw new Error("Contract or address not available");
    }

    setIsDepositing(true);
    setDepositError(null);
    setLastDepositTxHash(null);

    try {
      console.log(`Depositing NFT token ID: ${tokenId} for user: ${address}`);
      
      // Call the depositUniPosition function and wait for the transaction to be mined
      const txHash = await orynContract.write.depositUniPosition([BigInt(tokenId)]);
      
      console.log("Deposit transaction submitted:", txHash);
      setLastDepositTxHash(txHash);
      
      // Wait for the transaction to be mined and get the receipt
      const receipt = await waitForTransactionReceipt(walletClient as Client, { hash: txHash });
      
      if (receipt.status === 'success') {
        console.log("Transaction confirmed:", receipt);
        
        // The position ID is returned by the contract function
        // We can get it by simulating the call or by parsing events
        // For now, let's fetch the user positions to get the latest position ID
        await fetchUserPositions();
        
        // Return the transaction hash and a placeholder position ID
        // The actual position ID will be available in userPositions after the transaction
        return {
          positionId: BigInt(0), // This will be updated when we can parse the return value
          txHash: txHash
        };
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Failed to deposit Uni position:", error);
      setDepositError(error);
      throw error;
    } finally {
      setIsDepositing(false);
    }
  }, [orynContract, address, fetchUserPositions]);

  // Combined function to approve and then deposit NFT
  const approveAndDepositNFT = useCallback(async (tokenId: number): Promise<{ positionId: bigint; approvalTxHash: string; depositTxHash: string }> => {
    try {
      console.log(`Starting approve and deposit flow for token ID: ${tokenId}`);
      
      // Step 1: Approve the NFT
      console.log("Step 1: Approving NFT...");
      const approvalTxHash = await approveNFT(tokenId);
      console.log("Approval completed:", approvalTxHash);
      
      // Step 2: Deposit the NFT
      console.log("Step 2: Depositing NFT...");
      const depositResult = await depositUniPosition(tokenId);
      console.log("Deposit completed:", depositResult);
      
      return {
        positionId: depositResult.positionId,
        approvalTxHash,
        depositTxHash: depositResult.txHash
      };
    } catch (error) {
      console.error("Approve and deposit flow failed:", error);
      throw error;
    }
  }, [approveNFT, depositUniPosition]);

  // Function to mint OrynUSD tokens
  const mintOrynUSD = useCallback(async (positionId: number, amount: bigint): Promise<string> => {
    if (!orynContract || !address) {
      throw new Error("Contract or address not available");
    }

    setIsMinting(true);
    setMintError(null);
    setLastMintTxHash(null);

    try {
      console.log(`Minting ${amount} OrynUSD for position ${positionId}`);
      
      // Call the mintOrynUSD function
      const txHash = await orynContract.write.mintOrynUSD([BigInt(positionId), amount]);
      
      console.log("Mint transaction submitted:", txHash);
      setLastMintTxHash(txHash);
      
      // Wait for the transaction to be mined
      const receipt = await waitForTransactionReceipt(walletClient as Client, { hash: txHash });
      
      if (receipt.status === 'success') {
        console.log("Mint transaction confirmed:", receipt);
        // Refresh user positions to get updated data
        await fetchUserPositions();
        return txHash;
      } else {
        throw new Error("Mint transaction failed");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Failed to mint OrynUSD:", error);
      setMintError(error);
      throw error;
    } finally {
      setIsMinting(false);
    }
  }, [orynContract, address, walletClient, fetchUserPositions]);

  // Function to burn OrynUSD tokens (repay debt) with approval
  const burnOrynUSD = useCallback(async (positionId: number, amount: bigint): Promise<{ approvalTxHash?: string; burnTxHash: string }> => {
    if (!orynContract || !address) {
      throw new Error("Contract or address not available");
    }

    setIsRepaying(true);
    setRepayError(null);
    setLastRepayTxHash(null);

    try {
      console.log(`Starting repay flow for ${amount} OrynUSD for position ${positionId}`);
      
      // Step 1: Get OrynUSD contract address if not already set
      if (!orynUSDContractAddress) {
        console.log("Step 1: Getting OrynUSD contract address...");
        await getOrynUSDContractAddress();
      }
      
      // Step 2: Approve OrynUSD tokens
      console.log("Step 2: Approving OrynUSD tokens...");
      let approvalTxHash: string | undefined;
      try {
        approvalTxHash = await approveOrynUSD();
        console.log("Token approval completed:", approvalTxHash);
      } catch (approvalError) {
        console.warn("Token approval failed or not needed:", approvalError);
        // Continue with burn even if approval fails (might already be approved)
      }
      
      // Step 3: Burn OrynUSD tokens
      console.log("Step 3: Burning OrynUSD tokens...");
      const txHash = await orynContract.write.burnOrynUSD([BigInt(positionId), amount]);
      
      console.log("Repay transaction submitted:", txHash);
      setLastRepayTxHash(txHash);
      
      // Wait for the transaction to be mined
      const receipt = await waitForTransactionReceipt(walletClient as Client, { hash: txHash });
      
      if (receipt.status === 'success') {
        console.log("Repay transaction confirmed:", receipt);
        // Refresh user positions to get updated data
        await fetchUserPositions();
        return { approvalTxHash, burnTxHash: txHash };
      } else {
        throw new Error("Repay transaction failed");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Failed to repay OrynUSD:", error);
      setRepayError(error);
      throw error;
    } finally {
      setIsRepaying(false);
    }
  }, [orynContract, address, walletClient, fetchUserPositions, orynUSDContractAddress, getOrynUSDContractAddress, approveOrynUSD]);

  // Function to redeem UniPosition (withdraw NFT when debt is 0)
  const redeemUniPosition = useCallback(async (positionId: number): Promise<string> => {
    if (!orynContract || !address) {
      throw new Error("Contract or address not available");
    }

    setIsRedeeming(true);
    setRedeemError(null);
    setLastRedeemTxHash(null);

    try {
      console.log(`Redeeming UniPosition ${positionId}`);
      
      // Call the redeemUniPosition function
      const txHash = await orynContract.write.redeemUniPosition([BigInt(positionId)]);
      
      console.log("Redeem transaction submitted:", txHash);
      setLastRedeemTxHash(txHash);
      
      // Wait for the transaction to be mined
      const receipt = await waitForTransactionReceipt(walletClient as Client, { hash: txHash });
      
      if (receipt.status === 'success') {
        console.log("Redeem transaction confirmed:", receipt);
        // Refresh user positions to get updated data
        await fetchUserPositions();
        return txHash;
      } else {
        throw new Error("Redeem transaction failed");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Failed to redeem UniPosition:", error);
      setRedeemError(error);
      throw error;
    } finally {
      setIsRedeeming(false);
    }
  }, [orynContract, address, walletClient, fetchUserPositions]);

  // Function to check if an NFT is already deposited
  const isNFTDeposited = useCallback((tokenId: number): boolean => {
    if (!userPositions || !Array.isArray(userPositions)) return false;
    
    // Check if the tokenId exists in userPositions
    // This assumes userPositions contains the deposited token IDs
    return userPositions.some((position: any) => 
      position.tokenId && Number(position.tokenId) === tokenId
    );
  }, [userPositions]);

  // Optionally, call fetchUserPositions when needed, e.g. in a useEffect

  


  return {
    fetchUserPositions,
    fetchUserNFTs,
    fetchNFTPositionDetails,
    fetchAllNFTDetails,
    depositUniPosition,
    approveNFT,
    approveAndDepositNFT,
    getOrynUSDContractAddress,
    approveOrynUSD,
    mintOrynUSD,
    burnOrynUSD,
    redeemUniPosition,
    isNFTDeposited,
    userPositions,
    userTokenIds,
    isLoadingNFTs,
    isLoadingAllDetails,
    isDepositing,
    isApproving,
    isApprovingToken,
    isMinting,
    isRepaying,
    isRedeeming,
    nftError,
    error,
    depositError,
    approvalError,
    tokenApprovalError,
    mintError,
    repayError,
    redeemError,
    lastDepositTxHash,
    lastApprovalTxHash,
    lastTokenApprovalTxHash,
    lastMintTxHash,
    lastRepayTxHash,
    lastRedeemTxHash,
    orynUSDContractAddress
  }
};
