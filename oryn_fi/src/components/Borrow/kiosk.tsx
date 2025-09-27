import { useState } from "react";
import { BorrowInput } from "./BorrowInput";
import { IOType, MAX_LTV } from "../../constants/constants";
import { Button } from "../UI/Button";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../UI/tooltip";
import { useAccount } from "wagmi";
import { useNFTStore } from "../../stores/nftStore";
import { formatUSDValue } from "../../utils/tokenMetadata";
import { 
  calculateMaxBorrowPower, 
  calculateLiquidationThreshold, 
  calculateHealthFactor, 
  getHealthFactorColor,
  convertBigIntToUSD 
} from "../../utils/borrowCalculations";
import { useDebounce } from "../../hooks/useDebounce";
import { useContracts } from "../../hooks/useContracts";

export const Kiosk = () => {
  const { address } = useAccount();
  const { selectedNFT, allNFTDetails } = useNFTStore();
  const { 
    approveAndDepositNFT, 
    isDepositing, 
    isApproving, 
    depositError, 
    approvalError, 
    lastDepositTxHash, 
    lastApprovalTxHash, 
    isNFTDeposited: checkIsNFTDeposited 
  } = useContracts();
  
  // State for borrow amount and validation
  const [borrowAmount, setBorrowAmount] = useState<number>(0);
  const [isValidAmount, setIsValidAmount] = useState<boolean>(true);
  const [depositSuccess, setDepositSuccess] = useState<boolean>(false);
  
  // Get the details for the selected NFT from the stored data
  const selectedNFTDetails = selectedNFT.tokenId ? allNFTDetails[selectedNFT.tokenId] : null;
  
  // Calculate fiat value from the NFT position
  const fiatValue = selectedNFTDetails ? convertBigIntToUSD(selectedNFTDetails.positionDetails.totalValueUSD) : 0;
  
  // Calculate max borrow power (80% of fiat value)
  const maxBorrowPower = calculateMaxBorrowPower(fiatValue);
  
  // Debounce the borrow amount for health factor calculation
  const debouncedBorrowAmount = useDebounce(borrowAmount, 300);
  
  // Calculate health factor based on debounced amount
  const healthFactor = calculateHealthFactor(debouncedBorrowAmount, maxBorrowPower);
  
  // Calculate liquidation threshold
  const liquidationThreshold = calculateLiquidationThreshold(debouncedBorrowAmount, maxBorrowPower);
  
  // Check if the selected NFT is already deposited
  const isNFTDeposited = selectedNFT.tokenId ? checkIsNFTDeposited(selectedNFT.tokenId) : false;
  
  // Handle approve and deposit function
  const handleApproveAndDepositNFT = async () => {
    if (!selectedNFT.tokenId) return;
    
    try {
      setDepositSuccess(false);
      const result = await approveAndDepositNFT(selectedNFT.tokenId);
      console.log("NFT approved and deposited successfully:", result);
      setDepositSuccess(true);
    } catch (error) {
      console.error("Failed to approve and deposit NFT:", error);
    }
  };
  
  // Determine if borrow button should be enabled
  const isBorrowEnabled = address && 
    selectedNFT.tokenId && 
    selectedNFTDetails && 
    isValidAmount && 
    borrowAmount > 0 && 
    borrowAmount <= maxBorrowPower &&
    isNFTDeposited; // Only allow borrowing if NFT is deposited
  
  // Debug logging
  console.log("Kiosk Debug:", {
    selectedNFTTokenId: selectedNFT.tokenId,
    allNFTDetailsKeys: Object.keys(allNFTDetails),
    selectedNFTDetails: selectedNFTDetails,
    fiatValue,
    maxBorrowPower,
    borrowAmount,
    healthFactor,
    isBorrowEnabled
  });

  return address ? (
    <div className="flex flex-col gap-3 px-2 pb-3 pt-2 sm:px-3 sm:pb-4 sm:pt-3 w-full text-dark-grey">
      <h4 className="text-sm font-medium sticky inset-0">
        Selected NFT Details
      </h4>
      {!selectedNFT.tokenId ? (
        <div className="flex items-center justify-center h-full min-h-[400px] rounded-2xl bg-gray-50 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm font-medium">No NFT selected</p>
            <p className="text-gray-500 text-xs mt-1">Click on an NFT from the list to view details</p>
          </div>
        </div>
      ) : selectedNFT.isLoadingDetails ? (
        <div className="flex items-center justify-center h-full min-h-[400px] rounded-2xl bg-gray-50 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm font-medium">Loading NFT details...</p>
            <p className="text-gray-500 text-xs mt-1">Fetching position information</p>
          </div>
        </div>
      ) : selectedNFT.error ? (
        <div className="flex items-center justify-center h-full min-h-[400px] rounded-2xl bg-red-50 border border-red-200">
          <div className="text-center">
            <p className="text-red-600 text-sm font-medium">Error loading NFT details</p>
            <p className="text-red-500 text-xs mt-1">{selectedNFT.error}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="gap-2 rounded-2xl bg-white/50 p-4 grid grid-cols-2 mt-2">
        <span className="flex items-center justify-start gap-1.5">
          <h5 className="text-sm font-medium text-mid-grey">Pair:</h5>
          <p className="text-lg tracking-tighter font-medium">
            {selectedNFTDetails ? (
              <>
                <img 
                  src={selectedNFTDetails.token0Metadata.logo} 
                  alt={selectedNFTDetails.token0Metadata.symbol}
                  className="w-4 h-4 inline-block mr-1 rounded-sm"
                />
                {selectedNFTDetails.token0Metadata.symbol} / {selectedNFTDetails.token1Metadata.symbol}
                <img 
                  src={selectedNFTDetails.token1Metadata.logo} 
                  alt={selectedNFTDetails.token1Metadata.symbol}
                  className="w-4 h-4 inline-block ml-1 rounded-sm"
                />
                <span className="text-sm text-mid-grey ml-2">
                  ({selectedNFTDetails.positionDetails.fee / 10000}% fee)
                </span>
              </>
            ) : (
              'Loading...'
            )}
          </p>
        </span>
        <span className="flex items-center justify-start gap-1.5">
          <h5 className="text-sm font-medium text-mid-grey">NFT ID:</h5>
          <p className="text-lg font-medium">
            {selectedNFT.tokenId ? `#${selectedNFT.tokenId}` : 'No NFT selected'}
          </p>
        </span>
        <span className="flex items-center justify-start gap-1.5">
          <h5 className="text-sm font-medium text-mid-grey">Current Value:</h5>
          <p className="text-lg font-medium">
            {selectedNFTDetails ? 
              formatUSDValue(selectedNFTDetails.positionDetails.totalValueUSD) : 
              'Loading...'
            }
          </p>
        </span>
        <span className="flex items-center justify-start gap-1.5">
          <h5 className="text-sm font-medium text-mid-grey">Fees Acquired:</h5>
          <p className="text-lg font-medium">
            {selectedNFTDetails ? 
              formatUSDValue(selectedNFTDetails.positionDetails.feeValueUSD) : 
              'Loading...'
            }
          </p>
        </span>
      </div>
      
      {/* Approve and Deposit NFT Section */}
      {selectedNFT.tokenId && !isNFTDeposited && (
        <div className="flex flex-col gap-3 rounded-2xl bg-white/75 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-mid-grey">Approve & Deposit NFT</h5>
              <p className="text-xs text-mid-grey mt-1">
                First approve the Oryn contract to transfer your NFT, then deposit it as collateral
              </p>
            </div>
            <Button
              onClick={handleApproveAndDepositNFT}
              disabled={isApproving || isDepositing}
              className={`transition-all duration-300 ${
                (isApproving || isDepositing) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isApproving ? 'Approving...' : isDepositing ? 'Depositing...' : 'Approve & Deposit NFT'}
            </Button>
          </div>
          
          {/* Progress Steps */}
          {(isApproving || isDepositing) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${isApproving ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                <span className={isApproving ? 'text-blue-600' : 'text-green-600'}>
                  {isApproving ? 'Step 1: Approving NFT...' : 'Step 1: ✅ Approval Complete'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${isDepositing ? 'bg-blue-500' : isApproving ? 'bg-gray-300' : 'bg-green-500'}`}></div>
                <span className={isDepositing ? 'text-blue-600' : isApproving ? 'text-gray-500' : 'text-green-600'}>
                  {isDepositing ? 'Step 2: Depositing NFT...' : isApproving ? 'Step 2: Waiting for approval...' : 'Step 2: ✅ Deposit Complete'}
                </span>
              </div>
            </div>
          )}
          
          {/* Success/Error Messages */}
          {depositSuccess && (
            <div className="text-green-600 text-sm bg-green-50 p-2 rounded-lg">
              ✅ NFT approved and deposited successfully! 
              <div className="text-xs mt-1">
                Approval: {lastApprovalTxHash?.slice(0, 10)}... | Deposit: {lastDepositTxHash?.slice(0, 10)}...
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
      )}
      
      {/* Borrow Section - Only show if NFT is deposited */}
      {isNFTDeposited && (
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
      )}
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
            {selectedNFTDetails ? `$${maxBorrowPower.toFixed(2)}` : 'N/A'}
          </p>
        </span>
        <span className="flex items-center justify-start gap-1.5">
          <h5 className="text-sm font-medium text-mid-grey">
            Liquidation Threshold:
          </h5>
          <div className="flex items-center gap-1">
            <p className="text-lg font-medium">
              {selectedNFTDetails ? `$${liquidationThreshold.toFixed(2)}` : 'N/A'}
            </p>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="w-4 h-4 cursor-pointer text-mid-grey" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-56">
                  The collateral value limit beyond which your position can be
                  liquidated.
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
              <p className="text-lg font-medium">
                {selectedNFTDetails ? 
                  (healthFactor === Infinity ? '∞' : healthFactor.toFixed(2)) : 
                  'N/A'
                }
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
                {/* Only show background gradient when HF is not at exact threshold values */}
                {selectedNFTDetails && healthFactor !== Infinity && ![1, 1.2, 1.4, 2].includes(healthFactor) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 rounded-full to-green-500 opacity-20"></div>
                )}
                {selectedNFTDetails && healthFactor !== Infinity && (
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      getHealthFactorColor(healthFactor) === "red"
                        ? "bg-red-500"
                        : getHealthFactorColor(healthFactor) === "orange"
                        ? "bg-orange-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        Math.max(((healthFactor - 1) / (2 - 1)) * 100, 0),
                        100
                      )}%`,
                    }}
                  ></div>
                )}
              </div>

              {/* HF value indicator */}
              {selectedNFTDetails && healthFactor !== Infinity && (
                <div
                  className="absolute -top-5 transform -translate-x-1/2 text-xs font-medium"
                  style={{
                    left: `${Math.min(
                      Math.max(((healthFactor - 1) / (2 - 1)) * 100, 5),
                      95
                    )}%`,
                  }}
                >
                  {healthFactor.toFixed(2)}
                </div>
              )}

              {/* Range markers */}
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
      {/* <InputAddressAndFeeRateDetails />
            <Button
            className={`mt-3 transition-colors duration-500`}
            variant={buttonVariant}
            size="lg"
            disabled={buttonDisabled || loadingDisabled}
            onClick={
              needsWalletConnection ? handleConnectWallet : handleSwapClick
              }
              >
              {buttonLabel}
              </Button> */}
          {isNFTDeposited ? (
            <Button 
              size="lg" 
              className={`w-full transition-all duration-300 ${
                !isBorrowEnabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isBorrowEnabled}
            >
              Borrow
            </Button>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Please deposit your NFT first to enable borrowing
              </p>
            </div>
          )}
        </>
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center w-full h-full rounded-2xl text-dark-grey">
      Please connect and select a NFT to Borrow
    </div>
  );
};
