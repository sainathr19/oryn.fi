import { useAccount } from "wagmi";
import { NFTPosition } from "../UI/NFTPosition";
import { SkeletonPosition } from "./SkeletonPosition";
import { WalletConnectButton } from "../UI/WalletConnect";

export const ListNFTs = () => {
  const { address } = useAccount();
  return (
    <div className="flex flex-col gap-3 px-2 pb-3 pt-2 sm:px-3 sm:pb-4 overflow-hidden sm:pt-3 w-full text-dark-grey">
      <h4 className="text-sm font-medium sticky inset-0">
        Available NFT's to deposit
      </h4>
      <div className="flex flex-col gap-3 w-full overflow-y-auto rounded-2xl pt-2">
        {address ? (
          <>
            <NFTPosition />
            <NFTPosition />
            <NFTPosition />
            <NFTPosition />
            <NFTPosition />
            <NFTPosition />
            <NFTPosition />
            <NFTPosition />
          </>
        ) : (
          <div className="relative flex flex-col gap-3 w-full rounded-2xl">
            <div className="bg-black/20 absolute w-full h-full rounded-2xl z-[99]" />
            <div className="absolute w-full h-full rounded-2xl flex items-center justify-center z-[100]">
              <WalletConnectButton size="lg" />
            </div>
            <SkeletonPosition />
          </div>
        )}
      </div>
    </div>
  );
};
