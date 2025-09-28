import { useState } from "react";
import { BorrowInput } from "./BorrowInput";
import { IOType, MAX_LTV } from "../../constants/constants";
import { Button } from "../UI/Button";
import { InfoIcon, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../UI/tooltip";
import { useAccount } from "wagmi";
import { useContracts } from "../../hooks/useContracts";

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

interface KioskProps {
  selectedPosition: PositionDetails | null;
  selectedNFT: number | null;
  onRedeem: () => void;
  onDepositSuccess?: (tokenId: number) => void;
  onBorrowSuccess?: () => void;
  isMinting: boolean;
  isRedeeming: boolean;
  mintError: Error | null;
  redeemError: Error | null;
  mintSuccess: boolean;
  redeemSuccess: boolean;
  lastMintTxHash: string | null;
  lastRedeemTxHash: string | null;
}

export const Kiosk = ({
  selectedPosition,
  selectedNFT,
  onRedeem,
  onDepositSuccess,
  onBorrowSuccess,
  isMinting,
  isRedeeming,
}: KioskProps) => {
  const { address } = useAccount();
  const {
    approveAndDepositNFT,
    isDepositing,
    isApproving,
    depositError,
    approvalError,
    lastDepositTxHash,
    lastApprovalTxHash,
    isNFTDeposited: checkIsNFTDeposited,
    mintOrynUSD,
    burnOrynUSD,
    isRepaying,
  } = useContracts();

  // State for borrow amount and validation
  const [borrowAmount, setBorrowAmount] = useState<bigint>(BigInt(0));
  const [isValidAmount, setIsValidAmount] = useState<boolean>(true);
  const [depositSuccess, setDepositSuccess] = useState<boolean>(false);
  const [isBorrowLoading, setIsBorrowLoading] = useState<boolean>(false);

  // State for repay amount and validation
  const [repayAmount, setRepayAmount] = useState<bigint>(BigInt(0));
  const [isValidRepayAmount, setIsValidRepayAmount] = useState<boolean>(true);
  const [isRepayLoading, setIsRepayLoading] = useState<boolean>(false);

  // Calculate fiat value from the selected position
  const fiatValue = selectedPosition
    ? Number(selectedPosition.collateralValueUSD) / Math.pow(10, 18)
    : 0;

  // Calculate max borrow power (80% of fiat value)
  const maxBorrowPower = fiatValue * 0.8;

  // Calculate health factor based on borrow amount
  const currentDebt = selectedPosition
    ? Number(selectedPosition.debtValueUSD) / Math.pow(10, 18)
    : 0;

  // Calculate max loan amount (collateral value * LTV)
  const maxLoanAmount = fiatValue * MAX_LTV;

  // Health factor = max loan amount / (current debt + borrow amount)
  const borrowAmountNumber = Number(borrowAmount) / Math.pow(10, 18);
  const totalDebt = currentDebt + borrowAmountNumber;
  const healthFactor = totalDebt > 0 ? maxLoanAmount / totalDebt : Infinity;

  // Calculate liquidation threshold
  const liquidationThreshold = fiatValue * 0.8;

  // Check if the selected NFT is already deposited
  const isNFTDeposited = selectedNFT ? checkIsNFTDeposited(selectedNFT) : false;

  // Handle approve and deposit function
  const handleApproveAndDepositNFT = async () => {
    if (!selectedNFT) return;

    try {
      setDepositSuccess(false);
      const result = await approveAndDepositNFT(selectedNFT);
      console.log("NFT approved and deposited successfully:", result);
      setDepositSuccess(true);

      // Notify parent component about successful deposit
      if (onDepositSuccess) {
        onDepositSuccess(selectedNFT);
      }
    } catch (error) {
      console.error("Failed to approve and deposit NFT:", error);
    }
  };

  // Handle mint function with proper decimal conversion
  const handleMint = async () => {
    if (!selectedPosition || !borrowAmount || borrowAmount === BigInt(0)) {
      console.log("Cannot mint: missing position or invalid amount", {
        selectedPosition,
        borrowAmount,
      });
      return;
    }

    // Prevent multiple clicks
    if (isBorrowLoading) {
      console.log("Borrow already in progress, ignoring click");
      return;
    }

    try {
      setIsBorrowLoading(true);

      console.log("Starting mint process:", {
        positionId: Number(selectedPosition.positionId),
        borrowAmount: borrowAmount.toString(),
        borrowAmountNumber: Number(borrowAmount) / Math.pow(10, 18),
      });

      // Call mintOrynUSD directly with the BigInt amount
      await mintOrynUSD(
        Number(selectedPosition.positionId),
        borrowAmount
      );

      // Reset borrow amount after successful mint
      setBorrowAmount(BigInt(0));
      console.log("Borrow completed successfully");

      // Notify parent component about successful borrow
      if (onBorrowSuccess) {
        onBorrowSuccess();
      }
    } catch (error) {
      console.error("Failed to mint:", error);
    } finally {
      setIsBorrowLoading(false);
    }
  };

  // Handle repay function with proper decimal conversion
  const handleRepay = async () => {
    if (!selectedPosition || !repayAmount || repayAmount === BigInt(0)) {
      console.log("Cannot repay: missing position or invalid amount", {
        selectedPosition,
        repayAmount,
      });
      return;
    }

    // Prevent multiple clicks
    if (isRepayLoading) {
      console.log("Repay already in progress, ignoring click");
      return;
    }

    try {
      setIsRepayLoading(true);

      console.log("Starting repay process:", {
        positionId: Number(selectedPosition.positionId),
        repayAmount: repayAmount.toString(),
        repayAmountNumber: Number(repayAmount) / Math.pow(10, 18),
      });

      // Call burnOrynUSD directly with the BigInt amount
      await burnOrynUSD(
        Number(selectedPosition.positionId),
        repayAmount
      );

      // Reset repay amount after successful repay
      setRepayAmount(BigInt(0));
      console.log("Repay completed successfully");
    } catch (error) {
      console.error("Failed to repay:", error);
    } finally {
      setIsRepayLoading(false);
    }
  };

  // Determine if borrow button should be enabled
  const isBorrowEnabled =
    address &&
    selectedPosition &&
    isValidAmount &&
    borrowAmount > BigInt(0) &&
    borrowAmountNumber <= maxBorrowPower &&
    !isMinting &&
    !isBorrowLoading;

  // Determine if repay button should be enabled
  const isRepayEnabled =
    address &&
    selectedPosition &&
    isValidRepayAmount &&
    repayAmount > BigInt(0) &&
    Number(repayAmount) / Math.pow(10, 18) <= Number(selectedPosition.debtValueUSD) / Math.pow(10, 18) &&
    !isRepaying &&
    !isRepayLoading;

  const getHealthFactorColor = (hf: number): string => {
    if (hf === Infinity) return "text-green-600";
    if (hf >= 2) return "text-green-600";
    if (hf >= 1.5) return "text-green-600";
    if (hf >= 1.2) return "text-orange-600";
    return "text-red-600";
  };

  const formatUSDValue = (value: bigint): string => {
    if (!value || value === 0n) return "$0.00";
    return `$${(Number(value) / Math.pow(10, 18)).toFixed(2)}`;
  };

  return address ? (
    <div className="flex flex-col gap-3 px-2 pb-3 pt-2 sm:px-3 sm:pb-4 sm:pt-3 w-full text-dark-grey">
      <h4 className="text-sm font-medium sticky inset-0">
        {selectedPosition
          ? "Borrow Against Position"
          : selectedNFT
          ? "Deposit NFT"
          : "Select NFT or Position"}
      </h4>
      {!selectedPosition && !selectedNFT ? (
        <div className="flex items-center justify-center h-full min-h-[400px] rounded-2xl bg-gray-50 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm font-medium">
              No NFT or position selected
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Click on an NFT or position from the list to get started
            </p>
          </div>
        </div>
      ) : selectedNFT && !isNFTDeposited ? (
        // Show approve & deposit UI for selected NFT
        <>
          <div className="gap-2 rounded-2xl bg-white/50 p-4 grid grid-cols-2 mt-2">
            <span className="flex items-center justify-start gap-1.5">
              <h5 className="text-sm font-medium text-mid-grey">NFT ID:</h5>
              <p className="text-lg font-medium">#{selectedNFT}</p>
            </span>
            <span className="flex items-center justify-start gap-1.5">
              <h5 className="text-sm font-medium text-mid-grey">Status:</h5>
              <p className="text-lg font-medium text-blue-600">Available</p>
            </span>
          </div>

          {/* Approve and Deposit NFT Section */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white/75 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-mid-grey text-nowrap">
                  Approve & Deposit NFT
                </h5>
                <p className="text-xs text-mid-grey mt-1">
                  First approve the Oryn contract to transfer your NFT, then
                  deposit it as collateral
                </p>
              </div>
              <Button
                onClick={handleApproveAndDepositNFT}
                disabled={isApproving || isDepositing}
                className={`transition-all duration-300 ${
                  isApproving || isDepositing
                    ? "opacity-50 cursor-not-allowed text-nowrap"
                    : ""
                }`}
              >
                {isApproving
                  ? "Approving..."
                  : isDepositing
                  ? "Depositing..."
                  : "Approve & Deposit NFT"}
              </Button>
            </div>

            {/* Progress Steps */}
            {(isApproving || isDepositing) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isApproving ? "bg-blue-500" : "bg-green-500"
                    }`}
                  ></div>
                  <span
                    className={isApproving ? "text-blue-600" : "text-green-600"}
                  >
                    {isApproving
                      ? "Step 1: Approving NFT..."
                      : "Step 1: ✅ Approval Complete"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isDepositing
                        ? "bg-blue-500"
                        : isApproving
                        ? "bg-gray-300"
                        : "bg-green-500"
                    }`}
                  ></div>
                  <span
                    className={
                      isDepositing
                        ? "text-blue-600"
                        : isApproving
                        ? "text-gray-500"
                        : "text-green-600"
                    }
                  >
                    {isDepositing
                      ? "Step 2: Depositing NFT..."
                      : isApproving
                      ? "Step 2: Waiting for approval..."
                      : "Step 2: ✅ Deposit Complete"}
                  </span>
                </div>
              </div>
            )}

            {/* Success/Error Messages */}
            {depositSuccess && (
              <div className="text-green-600 text-sm bg-green-50 p-2 rounded-lg">
                ✅ NFT approved and deposited successfully!
                <div className="text-xs mt-1">
                  Approval: {lastApprovalTxHash?.slice(0, 10)}... | Deposit:{" "}
                  {lastDepositTxHash?.slice(0, 10)}...
                </div>
              </div>
            )}

            {approvalError && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                ❌ Approval failed: {approvalError.message}
              </div>
            )}

            {depositError && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                ❌ Deposit failed: {depositError.message}
              </div>
            )}
          </div>
        </>
      ) : selectedPosition ? (
        // Show borrow UI for selected position
        <>
          <div className="gap-2 rounded-2xl bg-white/50 p-4 grid grid-cols-2 mt-2">
            <span className="flex items-center justify-start gap-1.5">
              <h5 className="text-sm font-medium text-mid-grey">
                Position ID:
              </h5>
              <p className="text-lg font-medium">
                #{selectedPosition.positionId.toString()}
              </p>
            </span>
            <span className="flex items-center justify-start gap-1.5">
              <h5 className="text-sm font-medium text-mid-grey">NFT ID:</h5>
              <p className="text-lg font-medium">
                #{selectedPosition.uniTokenId.toString()}
              </p>
            </span>
            <span className="flex items-center justify-start gap-1.5">
              <h5 className="text-sm font-medium text-mid-grey">
                Collateral Value:
              </h5>
              <p className="text-lg font-medium">
                {formatUSDValue(selectedPosition.collateralValueUSD)}
              </p>
            </span>
            <span className="flex items-center justify-start gap-1.5">
              <h5 className="text-sm font-medium text-mid-grey">
                Current Debt:
              </h5>
              <p className="text-lg font-medium">
                {formatUSDValue(selectedPosition.debtValueUSD)}
              </p>
            </span>
          </div>

          {/* Borrow Input Section */}
          <div className="relative flex flex-col gap-3 w-full">
            <BorrowInput
              type={IOType.loan}
              maxValue={maxBorrowPower}
              onAmountChange={setBorrowAmount}
              onValidationChange={(isValid) => {
                setIsValidAmount(isValid);
              }}
            />
          </div>

          <div className="gap-2 rounded-2xl bg-white/75 p-4 grid grid-cols-[1fr_2fr_2fr]">
            <span className="flex items-center justify-start gap-1.5">
              <h5 className="text-sm font-medium text-mid-grey">LTV:</h5>
              <div className="flex items-center gap-1">
                <p className="text-lg font-medium">{MAX_LTV}</p>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="w-4 h-4 cursor-pointer text-mid-grey" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Loan-to-Value Ratio</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </span>
            <span className="flex items-center justify-start gap-1.5">
              <h5 className="text-sm font-medium text-mid-grey">
                Borrow power (max):
              </h5>
              <p className="text-lg font-medium">
                ${maxBorrowPower.toFixed(2)}
              </p>
            </span>
            <span className="flex items-center justify-start gap-1.5">
              <h5 className="text-sm font-medium text-mid-grey">
                Liquidation Threshold:
              </h5>
              <div className="flex items-center gap-1">
                <p className="text-lg font-medium">
                  ${liquidationThreshold.toFixed(2)}
                </p>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="w-4 h-4 cursor-pointer text-mid-grey" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-56">
                      The collateral value limit beyond which your position can
                      be liquidated.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </span>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-white/75 p-4">
            <span className="flex items-center justify-start gap-1.5">
              <h5 className="text-sm font-medium text-mid-grey text-nowrap">
                Health Factor:
              </h5>
              <div className="flex items-center justify-start w-full gap-8">
                <div className="flex items-center gap-1">
                  <p
                    className={`text-lg font-medium ${getHealthFactorColor(
                      healthFactor
                    )}`}
                  >
                    {borrowAmount === BigInt(0)
                      ? "--"
                      : healthFactor === Infinity
                      ? "∞"
                      : healthFactor.toFixed(2)}
                  </p>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="w-4 h-4 cursor-pointer text-mid-grey" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-2">
                        <p className="font-medium">Health Factor Status:</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>{`HF > 2 = Very safe`}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span>{`HF ~1.2 – 1.5 = Getting risky`}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>{`HF = 1 = Liquidation line`}</span>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="relative w-full translate-y-2/3">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    {healthFactor !== Infinity && (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          getHealthFactorColor(healthFactor) === "text-red-600"
                            ? "bg-red-500"
                            : getHealthFactorColor(healthFactor) ===
                              "text-orange-600"
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            Math.max(
                              ((Math.min(healthFactor, 2) - 1) / (2 - 1)) * 100,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      ></div>
                    )}
                  </div>

                  {healthFactor !== Infinity &&
                    (() => {
                      // Calculate the position percentage
                      // Map health factor to 0-100% where 1 = 0%, 2 = 100%
                      // For values > 2, cap at 100%
                      const normalizedHF = Math.min(healthFactor, 2);
                      const positionPercent = Math.min(
                        Math.max(((normalizedHF - 1) / (2 - 1)) * 100, 0),
                        100
                      );

                      // Estimate label width (approximately 3-4 characters * 6px per character)
                      const labelWidth = 24; // pixels
                      const containerWidth = 200; // approximate container width
                      const labelWidthPercent =
                        (labelWidth / containerWidth) * 100;

                      // Check if label would overlap with edges
                      const wouldOverlapLeft =
                        positionPercent - labelWidthPercent / 2 < 0;
                      const wouldOverlapRight =
                        positionPercent + labelWidthPercent / 2 > 100;

                      // Only show label if it won't overlap
                      if (wouldOverlapLeft || wouldOverlapRight) {
                        return null;
                      }

                      return (
                        <div
                          className="absolute -top-5 transform -translate-x-1/2 text-xs font-medium"
                          style={{
                            left: `${positionPercent}%`,
                          }}
                        >
                          {borrowAmount === BigInt(0) ? "-" : healthFactor.toFixed(2)}
                        </div>
                      );
                    })()}

                  <div className="absolute bottom-3 left-0 w-full flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>1.2</span>
                    <span>1.5</span>
                    <span>&gt;=2</span>
                  </div>
                </div>
              </div>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className={`flex-1 transition-all duration-300 ${
                !isBorrowEnabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!isBorrowEnabled}
              onClick={handleMint}
            >
              {isBorrowLoading || isMinting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Borrowing...</span>
                </div>
              ) : (
                "Borrow OUSDC"
              )}
            </Button>

            {/* Redeem Button - Only show when debt is zero */}
            {selectedPosition && Number(selectedPosition.debt) === 0 && (
              <Button
                size="lg"
                variant="primary"
                className="flex-1 transition-all duration-300"
                disabled={isRedeeming}
                onClick={onRedeem}
              >
                {isRedeeming ? "Redeeming..." : "Redeem NFT"}
              </Button>
            )}
          </div>

          {/* Simple Repay Input Section - Only show when there's debt */}
          {selectedPosition && Number(selectedPosition.debt) > 0 && (
            <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-gray-700">
                  Amount to Repay (OUSDC)
                </h5>
                <span className="text-xs text-gray-500">
                  Max: {formatUSDValue(selectedPosition.debtValueUSD)}
                </span>
              </div>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={Number(selectedPosition.debtValueUSD) / Math.pow(10, 18)}
                  value={repayAmount === BigInt(0) ? "" : (Number(repayAmount) / Math.pow(10, 18)).toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setRepayAmount(BigInt(0));
                      setIsValidRepayAmount(true);
                    } else {
                      const amount = BigInt(parseFloat(value) * Math.pow(10, 18));
                      setRepayAmount(amount);
                      const amountNumber = Number(amount) / Math.pow(10, 18);
                      setIsValidRepayAmount(
                        amountNumber > 0 &&
                          amountNumber <= Number(selectedPosition.debtValueUSD) / Math.pow(10, 18)
                      );
                    }
                  }}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Button
                  size="lg"
                  className={`px-6 transition-all duration-300 ${
                    !isRepayEnabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={!isRepayEnabled}
                  onClick={handleRepay}
                >
                  {isRepayLoading || isRepaying ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Repaying...</span>
                    </div>
                  ) : (
                    "Repay"
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  ) : (
    <div className="flex items-center justify-center w-full h-full rounded-2xl text-dark-grey">
      Please connect your wallet to borrow
    </div>
  );
};
