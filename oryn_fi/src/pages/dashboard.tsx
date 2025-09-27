import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useContracts } from "../hooks/useContracts";
import {
  convertBigIntToUSD,
  calculateMaxBorrowPower,
} from "../utils/borrowCalculations";
import { Button } from "../components/UI/Button";

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

export const Dashboard = () => {
  const { address } = useAccount();
  const {
    fetchUserPositions,
    userPositions,
    mintOrynUSD,
    burnOrynUSD,
    redeemUniPosition,
    isMinting,
    isRepaying,
    isRedeeming,
    mintError,
    repayError,
    lastMintTxHash,
    lastRepayTxHash,
  } = useContracts();

  const [positions, setPositions] = useState<PositionDetails[]>([]);
  const [activeTab, setActiveTab] = useState<"mint" | "repay">("mint");
  const [selectedPosition, setSelectedPosition] =
    useState<PositionDetails | null>(null);
  const [mintAmount, setMintAmount] = useState<string>("");
  const [repayAmount, setRepayAmount] = useState<string>("");
  const [mintSuccess, setMintSuccess] = useState(false);
  const [repaySuccess, setRepaySuccess] = useState(false);

  // Fetch user positions on component mount
  useEffect(() => {
    if (address && fetchUserPositions) {
      fetchUserPositions();
    }
  }, [address, fetchUserPositions]);

  // Process user positions when they change
  useEffect(() => {
    if (userPositions && Array.isArray(userPositions)) {
      // Filter out any invalid positions and ensure all required properties exist
      const validPositions = userPositions
        .filter(
          (position: any) =>
            position &&
            position.positionId !== undefined &&
            position.positionId !== null
        )
        .map((position: any) => ({
          positionId: BigInt(position.positionId || 0),
          collateralType: Number(position.collateralType || 0),
          token: position.token || "",
          amount: BigInt(position.amount || 0),
          uniTokenId: BigInt(position.uniTokenId || 0),
          debt: BigInt(position.debt || 0),
          collateralValueUSD: BigInt(position.collateralValueUSD || 0),
          feeValueUSD: BigInt(position.feeValueUSD || 0),
          totalValueUSD: BigInt(position.totalValueUSD || 0),
          debtValueUSD: BigInt(position.debtValueUSD || 0),
          healthFactor: BigInt(position.healthFactor || 0),
        }));
      setPositions(validPositions);
    } else {
      setPositions([]);
    }
  }, [userPositions]);

  const handleMint = async () => {
    if (!selectedPosition || !mintAmount) return;

    try {
      setMintSuccess(false);
      const amount = BigInt(parseFloat(mintAmount) * Math.pow(10, 6)); // OUSDC has 6 decimals
      await mintOrynUSD(Number(selectedPosition.positionId), amount);
      setMintSuccess(true);
      setMintAmount("");
    } catch (error) {
      console.error("Failed to mint:", error);
    }
  };

  const handleRepay = async () => {
    if (!selectedPosition || !repayAmount) return;

    try {
      setRepaySuccess(false);
      const amount = BigInt(parseFloat(repayAmount) * Math.pow(10, 6)); // OUSDC has 6 decimals
      await burnOrynUSD(Number(selectedPosition.positionId), amount);
      setRepaySuccess(true);
      setRepayAmount("");
    } catch (error) {
      console.error("Failed to repay:", error);
    }
  };

  const handleRedeem = async (position: PositionDetails) => {
    try {
      await redeemUniPosition(Number(position.positionId));
      console.log("NFT redeemed successfully");
    } catch (error) {
      console.error("Failed to redeem:", error);
    }
  };

  const getMaxMintAmount = (position: PositionDetails): number => {
    if (!position || !position.collateralValueUSD || !position.debtValueUSD)
      return 0;
    const collateralValue = convertBigIntToUSD(position.collateralValueUSD);
    const maxBorrowPower = calculateMaxBorrowPower(collateralValue);
    const currentDebt = convertBigIntToUSD(position.debtValueUSD);
    return Math.max(0, maxBorrowPower - currentDebt);
  };

  const getHealthFactorColor = (healthFactor: bigint): string => {
    if (!healthFactor || healthFactor === 0n) return "text-gray-600";
    const hf = Number(healthFactor) / Math.pow(10, 18); // Assuming 18 decimals
    if (hf >= 2) return "text-green-600";
    if (hf >= 1.5) return "text-green-600";
    if (hf >= 1.2) return "text-orange-600";
    return "text-red-600";
  };

  const formatUSDValue = (value: bigint): string => {
    if (!value || value === 0n) return "$0.00";
    return `$${convertBigIntToUSD(value).toFixed(2)}`;
  };

  if (!address) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Please Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Connect your wallet to view your positions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your NFT positions and debt</p>
        </div>

        {positions.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Positions Found
            </h3>
            <p className="text-gray-500">
              You don't have any deposited NFT positions yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Positions List */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Positions
              </h2>
              <div className="space-y-4">
                {positions.map((position) => (
                  <div
                    key={
                      position.positionId
                        ? position.positionId.toString()
                        : Math.random().toString()
                    }
                    className={`bg-white rounded-lg p-6 border-2 transition-all cursor-pointer ${
                      selectedPosition?.positionId === position.positionId
                        ? "border-purple-500 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPosition(position)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Position #
                          {position.positionId
                            ? position.positionId.toString()
                            : "N/A"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          NFT ID: #
                          {position.uniTokenId
                            ? position.uniTokenId.toString()
                            : "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-semibold ${getHealthFactorColor(
                            position.healthFactor
                          )}`}
                        >
                          HF:{" "}
                          {position.healthFactor
                            ? (
                                Number(position.healthFactor) / Math.pow(10, 18)
                              ).toFixed(2)
                            : "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">
                          Health Factor
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">
                          Collateral Value
                        </div>
                        <div className="font-semibold text-gray-800">
                          {formatUSDValue(position.collateralValueUSD)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Current Debt
                        </div>
                        <div className="font-semibold text-gray-800">
                          {formatUSDValue(position.debtValueUSD)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Fees Earned</div>
                        <div className="font-semibold text-gray-800">
                          {formatUSDValue(position.feeValueUSD)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Total Value</div>
                        <div className="font-semibold text-gray-800">
                          {formatUSDValue(position.totalValueUSD)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {Number(position.debt) === 0 ? (
                        <Button
                          onClick={() => handleRedeem(position)}
                          disabled={isRedeeming}
                          className="flex-1"
                        >
                          {isRedeeming ? "Redeeming..." : "Redeem NFT"}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedPosition(position);
                            setActiveTab("repay");
                          }}
                          className="flex-1"
                        >
                          Repay Debt
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Actions
                </h3>

                {!selectedPosition ? (
                  <p className="text-gray-500 text-center py-8">
                    Select a position to perform actions
                  </p>
                ) : (
                  <>
                    {/* Tab Navigation */}
                    <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setActiveTab("mint")}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          activeTab === "mint"
                            ? "bg-white text-purple-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        Mint
                      </button>
                      <button
                        onClick={() => setActiveTab("repay")}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          activeTab === "repay"
                            ? "bg-white text-purple-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        Repay
                      </button>
                    </div>

                    {/* Mint Tab */}
                    {activeTab === "mint" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount to Mint (OUSDC)
                          </label>
                          <input
                            type="number"
                            value={mintAmount}
                            onChange={(e) => setMintAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            max={getMaxMintAmount(selectedPosition)}
                            step="0.01"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Max: {getMaxMintAmount(selectedPosition).toFixed(2)}{" "}
                            OUSDC
                          </div>
                        </div>

                        <Button
                          onClick={handleMint}
                          disabled={
                            isMinting ||
                            !mintAmount ||
                            parseFloat(mintAmount) <= 0
                          }
                          className="w-full"
                        >
                          {isMinting ? "Minting..." : "Mint OUSDC"}
                        </Button>

                        {mintSuccess && (
                          <div className="text-green-600 text-sm bg-green-50 p-2 rounded-lg">
                            ✅ Mint successful! Transaction:{" "}
                            {lastMintTxHash?.slice(0, 10)}...
                          </div>
                        )}

                        {mintError && (
                          <div className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                            ❌ Mint failed: {mintError.message}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Repay Tab */}
                    {activeTab === "repay" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount to Repay (OUSDC)
                          </label>
                          <input
                            type="number"
                            value={repayAmount}
                            onChange={(e) => setRepayAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            max={convertBigIntToUSD(
                              selectedPosition.debtValueUSD
                            )}
                            step="0.01"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Max: {formatUSDValue(selectedPosition.debtValueUSD)}{" "}
                            OUSDC
                          </div>
                        </div>

                        <Button
                          onClick={handleRepay}
                          disabled={
                            isRepaying ||
                            !repayAmount ||
                            parseFloat(repayAmount) <= 0
                          }
                          className="w-full"
                        >
                          {isRepaying ? "Repaying..." : "Repay Debt"}
                        </Button>

                        {repaySuccess && (
                          <div className="text-green-600 text-sm bg-green-50 p-2 rounded-lg">
                            ✅ Repay successful! Transaction:{" "}
                            {lastRepayTxHash?.slice(0, 10)}...
                          </div>
                        )}

                        {repayError && (
                          <div className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                            ❌ Repay failed: {repayError.message}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Position Info */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Position Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Collateral Value:
                          </span>
                          <span className="font-medium">
                            {formatUSDValue(
                              selectedPosition.collateralValueUSD
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Debt:</span>
                          <span className="font-medium">
                            {formatUSDValue(selectedPosition.debtValueUSD)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Health Factor:</span>
                          <span
                            className={`font-medium ${getHealthFactorColor(
                              selectedPosition.healthFactor
                            )}`}
                          >
                            {(
                              Number(selectedPosition.healthFactor) /
                              Math.pow(10, 18)
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Borrow:</span>
                          <span className="font-medium">
                            {getMaxMintAmount(selectedPosition).toFixed(2)}{" "}
                            OUSDC
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
