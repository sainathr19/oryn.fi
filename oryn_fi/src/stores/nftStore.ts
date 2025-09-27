import { create } from 'zustand';

interface SelectedNFT {
  tokenId: number | null;
  // Add other NFT details here as needed
  // For now, we'll just use tokenId and static data
}

interface NFTStore {
  selectedNFT: SelectedNFT;
  setSelectedNFT: (tokenId: number | null) => void;
  clearSelection: () => void;
}

export const useNFTStore = create<NFTStore>((set) => ({
  selectedNFT: {
    tokenId: null,
  },
  setSelectedNFT: (tokenId: number | null) =>
    set((state) => ({
      selectedNFT: {
        ...state.selectedNFT,
        tokenId,
      },
    })),
  clearSelection: () =>
    set({
      selectedNFT: {
        tokenId: null,
      },
    }),
}));
