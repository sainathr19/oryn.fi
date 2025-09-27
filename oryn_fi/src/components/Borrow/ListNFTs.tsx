import { useAccount } from "wagmi";
import { NFTPosition } from "../UI/NFTPosition";
import { SkeletonPosition } from "./SkeletonPosition";
import { WalletConnectButton } from "../UI/WalletConnect";

interface ListNFTsProps {
  userTokenIds: number[];
  isLoadingNFTs: boolean;
  nftError: Error | null;
}

export const ListNFTs = ({ userTokenIds, isLoadingNFTs, nftError }: ListNFTsProps) => {
  const { address } = useAccount();
  
  const renderContent = () => {
    // No wallet connected - show skeleton with connect button
    if (!address) {
      console.log("Rendering: No wallet connected");
      return (
        <div className="relative flex flex-col gap-3 w-full rounded-2xl">
          <div className="bg-black/20 absolute w-full h-full rounded-2xl z-[99]" />
          <div className="absolute w-full h-full rounded-2xl flex items-center justify-center z-[100]">
            <WalletConnectButton size="lg" />
          </div>
          <SkeletonPosition />
        </div>
      );
    }

    // Loading state - show skeleton
    if (isLoadingNFTs) {
      console.log("Rendering: Loading state");
      return (
        <>
          <SkeletonPosition />
          <SkeletonPosition />
          <SkeletonPosition />
        </>
      );
    }

    // Error state
    if (nftError) {
      console.log("Rendering: Error state", nftError);
      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm font-medium">Failed to load NFTs</p>
          <p className="text-red-500 text-xs mt-1">{nftError.message}</p>
        </div>
      );
    }

    // No NFTs found
    if (userTokenIds.length === 0) {
      console.log("Rendering: No NFTs found");
      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gray-50 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">No NFTs found</p>
          <p className="text-gray-500 text-xs mt-1">You don't have any Uniswap V3 positions</p>
        </div>
      );
    }

    // Render NFTs
    console.log("Rendering: NFT positions", userTokenIds);
    return userTokenIds.map((tokenId) => (
      <NFTPosition key={tokenId} tokenId={tokenId} />
    ));
  };

  return (
    <div className="flex flex-col gap-3 px-2 pb-3 pt-2 sm:px-3 sm:pb-4 overflow-hidden sm:pt-3 w-full text-dark-grey">
      <h4 className="text-sm font-medium sticky inset-0">
        Available NFT's to deposit
      </h4>
      <div className="flex flex-col gap-3 w-full overflow-y-auto rounded-2xl pt-2">
        {renderContent()}
      </div>
    </div>
  );
};
