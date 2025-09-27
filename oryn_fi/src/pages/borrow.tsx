import { useEffect, useState } from "react";
import { Kiosk } from "../components/Borrow/kiosk";
import { ListNFTs } from "../components/Borrow/ListNFTs";
import { useContracts } from "../hooks/useContracts";
import { useAccount } from "wagmi";

interface PositionDetails {
  positionId: bigint;
  collateralType: number;
  token: string;
  amount: bigint;
  uniTokenId: bigint;
  debt: bigint;
  collateralValueUSD: bigint;
  feeValueUSD: bigint;
  totalValueUSD: bigint;
  debtValueUSD: bigint;
  healthFactor: bigint;
}

export const Borrow = () => {
  const { address } = useAccount();
  const {
    fetchUserPositions,
    fetchUserNFTs,
    fetchAllNFTDetails,
    userPositions,
    userTokenIds,
    isLoadingNFTs,
    nftError,
    redeemUniPosition,
    isMinting,
    isRedeeming,
    mintError,
    redeemError,
    lastMintTxHash,
    lastRedeemTxHash,
  } = useContracts();

  const [positions, setPositions] = useState<PositionDetails[]>([]);
  const [selectedPosition, setSelectedPosition] =
    useState<PositionDetails | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const [mintSuccess] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  // Fetch user positions and NFTs on component mount
  useEffect(() => {
    if (address && fetchUserPositions) {
      fetchUserPositions();
    }
    if (address && fetchUserNFTs) {
      fetchUserNFTs();
    }
  }, [address, fetchUserPositions, fetchUserNFTs]);

  // Fetch all NFT details when userTokenIds change
  useEffect(() => {
    if (userTokenIds.length > 0 && fetchAllNFTDetails) {
      fetchAllNFTDetails(userTokenIds);
    }
  }, [userTokenIds, fetchAllNFTDetails]);

  // Process user positions when they change
  useEffect(() => {
    if (userPositions && Array.isArray(userPositions)) {
      // Filter out any invalid positions and ensure all required properties exist
      const validPositions = userPositions
        .filter(
          (position: unknown) =>
            position &&
            typeof position === "object" &&
            position !== null &&
            "positionId" in position &&
            (position as { positionId: unknown }).positionId !== undefined &&
            (position as { positionId: unknown }).positionId !== null
        )
        .map((position: unknown) => {
          const pos = position as {
            positionId: unknown;
            collateralType: unknown;
            token: unknown;
            amount: unknown;
            uniTokenId: unknown;
            debt: unknown;
            collateralValueUSD: unknown;
            feeValueUSD: unknown;
            totalValueUSD: unknown;
            debtValueUSD: unknown;
            healthFactor: unknown;
          };
          return {
            positionId: BigInt(Number(pos.positionId) || 0),
            collateralType: Number(pos.collateralType) || 0,
            token: String(pos.token || ""),
            amount: BigInt(Number(pos.amount) || 0),
            uniTokenId: BigInt(Number(pos.uniTokenId) || 0),
            debt: BigInt(Number(pos.debt) || 0),
            collateralValueUSD: BigInt(Number(pos.collateralValueUSD) || 0),
            feeValueUSD: BigInt(Number(pos.feeValueUSD) || 0),
            totalValueUSD: BigInt(Number(pos.totalValueUSD) || 0),
            debtValueUSD: BigInt(Number(pos.debtValueUSD) || 0),
            healthFactor: BigInt(String(pos.healthFactor) || "0"),
          };
        });
      setPositions(validPositions);

      if (selectedPosition) {
        const updatedPosition = validPositions.find(
          (pos) =>
            Number(pos.positionId) === Number(selectedPosition.positionId)
        );
        if (updatedPosition) {
          setSelectedPosition(updatedPosition);
          console.log(
            "Selected position updated with fresh data:",
            updatedPosition
          );
        }
      }
    } else {
      setPositions([]);
    }
  }, [userPositions]);

  // Update selected position when userPositions changes (for refreshing after borrow/repay)
  useEffect(() => {
    if (selectedPosition && positions.length > 0) {
      const updatedPosition = positions.find(
        (pos) => Number(pos.positionId) === Number(selectedPosition.positionId)
      );
      if (updatedPosition) {
        // Only update if the data has actually changed to prevent unnecessary re-renders
        const hasChanged =
          updatedPosition.debt !== selectedPosition.debt ||
          updatedPosition.debtValueUSD !== selectedPosition.debtValueUSD ||
          updatedPosition.healthFactor !== selectedPosition.healthFactor;

        if (hasChanged) {
          setSelectedPosition(updatedPosition);
          console.log(
            "Selected position updated with fresh data:",
            updatedPosition
          );
        }
      }
    }
  }, [positions, selectedPosition]);

  const handleRedeem = async () => {
    if (!selectedPosition) return;

    try {
      setRedeemSuccess(false);
      await redeemUniPosition(Number(selectedPosition.positionId));
      setRedeemSuccess(true);
      // Clear selection and refresh positions after successful redeem
      setSelectedPosition(null);
      if (fetchUserPositions) {
        fetchUserPositions();
      }
    } catch (error) {
      console.error("Failed to redeem:", error);
    }
  };

  const handleDepositSuccess = async (tokenId: number) => {
    // Clear the selected NFT
    setSelectedNFT(null);

    // Refresh positions to include the newly deposited NFT
    if (fetchUserPositions) {
      await fetchUserPositions();
    }

    // Wait for the positions to be updated via useEffect
    // We'll use a more reliable approach by checking userPositions directly
    const checkForNewPosition = () => {
      if (userPositions && userPositions.length > 0) {
        const newPosition = userPositions.find(
          (pos: unknown) =>
            Number((pos as Record<string, unknown>).uniTokenId) === tokenId
        );
        if (newPosition) {
          // Convert to PositionDetails format
          const pos = newPosition as Record<string, unknown>;
          const positionDetails: PositionDetails = {
            positionId: BigInt(Number(pos.positionId) || 0),
            collateralType: Number(pos.collateralType) || 0,
            token: String(pos.token || ""),
            amount: BigInt(Number(pos.amount) || 0),
            uniTokenId: BigInt(Number(pos.uniTokenId) || 0),
            debt: BigInt(Number(pos.debt) || 0),
            collateralValueUSD: BigInt(Number(pos.collateralValueUSD) || 0),
            feeValueUSD: BigInt(Number(pos.feeValueUSD) || 0),
            totalValueUSD: BigInt(Number(pos.totalValueUSD) || 0),
            debtValueUSD: BigInt(Number(pos.debtValueUSD) || 0),
            healthFactor: BigInt(String(pos.healthFactor) || "0"),
          };
          setSelectedPosition(positionDetails);
          return true;
        }
      }
      return false;
    };

    // Try to find the position immediately, if not found, try again after a short delay
    if (!checkForNewPosition()) {
      setTimeout(() => {
        checkForNewPosition();
      }, 1000);
    }
  };

  const handleBorrowSuccess = async () => {
    console.log(
      "Borrow completed successfully - refreshing positions and balances"
    );

    // Refresh user positions to get updated debt information
    if (fetchUserPositions) {
      await fetchUserPositions();
    }

    // Refresh user NFTs to get updated balances
    if (fetchUserNFTs) {
      await fetchUserNFTs();
    }

    // The useEffect will automatically update the selected position when userPositions changes
  };

  const handleSelectNFT = (tokenId: number) => {
    setSelectedNFT(tokenId);
    setSelectedPosition(null); // Clear position selection when selecting NFT
  };

  const handleSelectPosition = (position: PositionDetails) => {
    setSelectedPosition(position);
    setSelectedNFT(null); // Clear NFT selection when selecting position
  };

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
            positions={positions}
            availableNFTs={userTokenIds}
            isLoadingNFTs={isLoadingNFTs}
            nftError={nftError}
            selectedPosition={selectedPosition}
            selectedNFT={selectedNFT}
            onSelectPosition={handleSelectPosition}
            onSelectNFT={handleSelectNFT}
          />
        </div>
        <div className="flex flex-col items-center h-full max-h-[75%] w-full bg-primary/5 z-40 backdrop-blur-lg rounded-2xl border border-white/50 p-1">
          <Kiosk
            selectedPosition={selectedPosition}
            selectedNFT={selectedNFT}
            onRedeem={handleRedeem}
            onDepositSuccess={handleDepositSuccess}
            onBorrowSuccess={handleBorrowSuccess}
            isMinting={isMinting}
            isRedeeming={isRedeeming}
            mintError={mintError}
            redeemError={redeemError}
            mintSuccess={mintSuccess}
            redeemSuccess={redeemSuccess}
            lastMintTxHash={lastMintTxHash}
            lastRedeemTxHash={lastRedeemTxHash}
          />
        </div>
      </div>
    </div>
  );
};
