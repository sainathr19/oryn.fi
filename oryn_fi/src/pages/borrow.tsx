import { useEffect } from "react";
import { Kiosk } from "../components/Borrow/kiosk";
import { ListNFTs } from "../components/Borrow/ListNFTs";
import { useContracts } from "../hooks/useContracts";

export const Borrow = () => {
  const { 
    fetchUserPositions, 
    fetchUserNFTs, 
    userTokenIds, 
    isLoadingNFTs, 
    nftError 
  } = useContracts();

  useEffect(() => {
    if (fetchUserPositions) {
      fetchUserPositions();
    }
    if (fetchUserNFTs) {
      fetchUserNFTs();
    }
  }, [fetchUserPositions, fetchUserNFTs])

  // Log the fetched token IDs
  useEffect(() => {
    if (userTokenIds.length > 0) {
      console.log("Fetched user token IDs:", userTokenIds);
    }
  }, [userTokenIds])

  // Log loading and error states
  useEffect(() => {
    if (isLoadingNFTs) {
      console.log("Loading user NFTs...");
    }
  }, [isLoadingNFTs])

  useEffect(() => {
    if (nftError) {
      console.error("NFT fetching error:", nftError);
    }
  }, [nftError])
  return (
    <div className="relative h-screen w-screen">
      <div
        className="fixed bottom-0 z-[1] h-full max-h-[612px] w-screen origin-bottom overflow-hidden opacity-60"
        style={{
          background:
            "linear-gradient(180deg, rgba(188, 237, 220, 0) 0%, #A27FE6 100%)",
        }}
      />
      <img
        src="/bgwall.png"
        alt="background"
        className="w-screen absolute inset-0 h-screen object-cover"
      />
      <div className="absolute grid grid-cols-[2fr_3fr] max-w-7xl gap-6 px-6 mx-auto items-center justify-center inset-0 w-screen text-white my-auto">
        <div className="flex flex-col items-center h-full max-h-[75%] w-full bg-primary/5 z-40 backdrop-blur-lg rounded-2xl border border-white/50 p-1">
          <ListNFTs 
            userTokenIds={userTokenIds}
            isLoadingNFTs={isLoadingNFTs}
            nftError={nftError}
          />
        </div>
        <div className="flex flex-col items-center h-full max-h-[75%] w-full bg-primary/5 z-40 backdrop-blur-lg rounded-2xl border border-white/50 p-1">
          <Kiosk />
        </div>
      </div>
    </div>
  );
};
