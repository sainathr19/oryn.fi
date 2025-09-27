import { NFTPosition } from "../UI/NFTPosition";

export const ListNFTs = () => {
  return (
    <div className="flex flex-col gap-3 px-2 pb-3 pt-2 sm:px-3 sm:pb-4 overflow-hidden sm:pt-3 w-full text-dark-grey">
      <h4 className="text-sm font-medium sticky inset-0">
        Available NFT's to deposit
      </h4>
      <div className="flex flex-col gap-3 w-full overflow-y-auto rounded-2xl pt-2">
        <NFTPosition />
        <NFTPosition />
        <NFTPosition />
        <NFTPosition />
        <NFTPosition />
        <NFTPosition />
        <NFTPosition />
        <NFTPosition />
      </div>
    </div>
  );
};
