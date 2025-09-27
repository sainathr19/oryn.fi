import { useAccount } from "wagmi";
import { SkeletonPosition } from "./SkeletonPosition";
import { WalletConnectButton } from "../UI/WalletConnect";
import { Button } from "../UI/Button";
import { useNFTStore } from "../../stores/nftStore";

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

interface ListNFTsProps {
  positions: PositionDetails[];
  availableNFTs: number[];
  isLoadingNFTs: boolean;
  nftError: Error | null;
  selectedPosition: PositionDetails | null;
  selectedNFT: number | null;
  onSelectPosition: (position: PositionDetails) => void;
  onSelectNFT: (tokenId: number) => void;
}

export const ListNFTs = ({
  positions,
  availableNFTs,
  isLoadingNFTs,
  nftError,
  selectedPosition,
  selectedNFT,
  onSelectPosition,
  onSelectNFT,
}: ListNFTsProps) => {
  const { address } = useAccount();
  const { allNFTDetails } = useNFTStore();

  const getHealthFactorColor = (healthFactor: bigint): string => {
    if (!healthFactor || healthFactor === 0n) return "text-gray-600";
    const hf = Number(healthFactor) / Math.pow(10, 18);
    if (hf >= 2) return "text-green-600";
    if (hf >= 1.5) return "text-green-600";
    if (hf >= 1.2) return "text-orange-600";
    return "text-red-600";
  };

  const formatHealthFactor = (healthFactor: bigint): string => {
    if (!healthFactor || healthFactor === 0n) return "N/A";
    const hf = Number(healthFactor) / Math.pow(10, 18);
    // If the health factor is extremely large (likely an error), return a reasonable default
    if (hf > 1000) return "∞";
    return hf.toFixed(2);
  };

  const formatUSDValue = (value: bigint): string => {
    if (!value || value === 0n) return "$0.00";
    return `$${(Number(value) / Math.pow(10, 18)).toFixed(2)}`;
  };

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
      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm font-medium">Error loading NFTs</p>
          <p className="text-red-500 text-xs mt-1">{nftError.message}</p>
        </div>
      );
    }

    // No NFTs or positions found
    if (positions.length === 0 && availableNFTs.length === 0) {
      console.log("Rendering: No NFTs or positions found");
      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gray-50 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">No NFTs found</p>
          <p className="text-gray-500 text-xs mt-1">
            You don't have any Uniswap V3 positions
          </p>
        </div>
      );
    }

    // Create a set of deposited NFT IDs for quick lookup
    const depositedNFTIds = new Set(
      positions.map((pos) => pos.uniTokenId.toString())
    );

    // Filter available NFTs to only show those not deposited
    const availableNFTsNotDeposited = availableNFTs.filter(
      (tokenId) => !depositedNFTIds.has(tokenId.toString())
    );

    console.log("Rendering: Mixed NFTs and positions", {
      positions,
      availableNFTsNotDeposited,
    });

    return (
      <>
        {/* Render deposited positions */}
        {positions.map((position) => (
          <div
            key={`deposited-${position.positionId.toString()}`}
            className={`bg-white/75 rounded-2xl p-4 border-2 transition-all cursor-pointer ${
              selectedPosition?.positionId === position.positionId
                ? "border-purple-500 shadow-lg"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onSelectPosition(position)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  DEPOSITED
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Position #{position.positionId.toString()}
                  </h3>
                  <p className="text-xs text-gray-600">
                    NFT ID: #{position.uniTokenId.toString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-semibold ${getHealthFactorColor(
                    position.healthFactor
                  )}`}
                >
                  HF: {formatHealthFactor(position.healthFactor)}
                </div>
                <div className="text-xs text-gray-600">Health Factor</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xs text-gray-600">Collateral Value</div>
                <div className="text-sm font-semibold text-gray-800">
                  {formatUSDValue(position.collateralValueUSD)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Current Debt</div>
                <div className="text-sm font-semibold text-gray-800">
                  {formatUSDValue(position.debtValueUSD)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Fees Earned</div>
                <div className="text-sm font-semibold text-gray-800">
                  {formatUSDValue(position.feeValueUSD)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Total Value</div>
                <div className="text-sm font-semibold text-gray-800">
                  {formatUSDValue(position.totalValueUSD)}
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                size="sm"
                className={`w-full ${
                  selectedPosition?.positionId === position.positionId
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {selectedPosition?.positionId === position.positionId
                  ? "Selected"
                  : "Select Position"}
              </Button>
            </div>
          </div>
        ))}

        {/* Render available NFTs */}
        {availableNFTsNotDeposited.map((tokenId) => {
          const nftDetails = allNFTDetails[tokenId];
          const hasDetails =
            nftDetails &&
            nftDetails.positionDetails &&
            nftDetails.token0Metadata &&
            nftDetails.token1Metadata;

          return (
            <div
              key={`available-${tokenId}`}
              className={`bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                selectedNFT === tokenId
                  ? "border-purple-500 shadow-lg"
                  : "border-purple-200 hover:border-purple-300"
              }`}
              onClick={() => onSelectNFT(tokenId)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    AVAILABLE
                  </div>
                  <div>
                    {hasDetails ? (
                      <>
                        <h3 className="text-sm font-semibold text-gray-800">
                          {nftDetails.token0Metadata.symbol} ●{" "}
                          {nftDetails.token1Metadata.symbol} #{tokenId}
                        </h3>
                        <p className="text-xs text-gray-600">
                          Fee Tier:{" "}
                          {(nftDetails.positionDetails.fee / 10000).toFixed(1)}%
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold text-gray-800">
                          NFT #{tokenId}
                        </h3>
                        <p className="text-xs text-gray-600">
                          Loading details...
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {hasDetails && (
                <div className="mb-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">
                      {formatUSDValue(nftDetails.positionDetails.totalValueUSD)}
                    </div>
                    <div className="text-xs text-gray-600">Current Value</div>
                  </div>
                </div>
              )}

              <div className="text-center">
                <Button size="md" className={`w-full`}>
                  {selectedNFT === tokenId ? "Selected" : "Select to Deposit"}
                </Button>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-3 px-2 pb-3 pt-2 sm:px-3 sm:pb-4 overflow-hidden sm:pt-3 w-full text-dark-grey">
      <h4 className="text-sm font-medium sticky inset-0">
        Your NFTs & Positions
      </h4>
      <div className="flex flex-col gap-3 w-full overflow-y-auto rounded-2xl pt-2">
        {renderContent()}
      </div>
    </div>
  );
};
