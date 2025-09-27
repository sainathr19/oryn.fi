import { create } from 'zustand';

interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
  tokenAddress: string;
}

interface NFTPositionDetails {
  token0: string;
  token1: string;
  fee: number;
  liquidity: bigint;
  totalValueUSD: bigint;
  principalValueUSD: bigint;
  feeValueUSD: bigint;
}

interface SelectedNFT {
  tokenId: number | null;
  positionDetails: NFTPositionDetails | null;
  token0Metadata: TokenMetadata | null;
  token1Metadata: TokenMetadata | null;
  isLoadingDetails: boolean;
  error: string | null;
}

interface NFTStore {
  selectedNFT: SelectedNFT;
  allNFTDetails: Record<number, {
    positionDetails: NFTPositionDetails;
    token0Metadata: TokenMetadata;
    token1Metadata: TokenMetadata;
  }>;
  setSelectedNFT: (tokenId: number | null) => void;
  setPositionDetails: (details: NFTPositionDetails) => void;
  setTokenMetadata: (token0: TokenMetadata, token1: TokenMetadata) => void;
  setAllNFTDetails: (tokenId: number, details: NFTPositionDetails, token0: TokenMetadata, token1: TokenMetadata) => void;
  setLoadingDetails: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSelection: () => void;
}

export const useNFTStore = create<NFTStore>((set) => ({
  selectedNFT: {
    tokenId: null,
    positionDetails: null,
    token0Metadata: null,
    token1Metadata: null,
    isLoadingDetails: false,
    error: null,
  },
  allNFTDetails: {},
  setSelectedNFT: (tokenId: number | null) =>
    set((state) => ({
      selectedNFT: {
        ...state.selectedNFT,
        tokenId,
        positionDetails: null,
        token0Metadata: null,
        token1Metadata: null,
        error: null,
      },
    })),
  setPositionDetails: (details: NFTPositionDetails) =>
    set((state) => ({
      selectedNFT: {
        ...state.selectedNFT,
        positionDetails: details,
      },
    })),
  setTokenMetadata: (token0: TokenMetadata, token1: TokenMetadata) =>
    set((state) => ({
      selectedNFT: {
        ...state.selectedNFT,
        token0Metadata: token0,
        token1Metadata: token1,
      },
    })),
  setAllNFTDetails: (tokenId: number, details: NFTPositionDetails, token0: TokenMetadata, token1: TokenMetadata) =>
    set((state) => ({
      allNFTDetails: {
        ...state.allNFTDetails,
        [tokenId]: {
          positionDetails: details,
          token0Metadata: token0,
          token1Metadata: token1,
        },
      },
    })),
  setLoadingDetails: (loading: boolean) =>
    set((state) => ({
      selectedNFT: {
        ...state.selectedNFT,
        isLoadingDetails: loading,
      },
    })),
  setError: (error: string | null) =>
    set((state) => ({
      selectedNFT: {
        ...state.selectedNFT,
        error,
      },
    })),
  clearSelection: () =>
    set({
      selectedNFT: {
        tokenId: null,
        positionDetails: null,
        token0Metadata: null,
        token1Metadata: null,
        isLoadingDetails: false,
        error: null,
      },
    }),
}));
