import { BorrowInput } from "./BorrowInput";
import { IOType } from "../../constants/constants";
import { Button } from "../UI/Button";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../UI/tooltip";
import { useAccount } from "wagmi";
import { useNFTStore } from "../../stores/nftStore";
const healthFactor = 1.8;

const getHealthFactorColor = (hf: number) => {
  if (hf >= 2) return "green";
  if (hf >= 1.5) return "green";
  if (hf >= 1.2) return "orange";
  return "red";
};

export const Kiosk = () => {
  const { address } = useAccount();
  const { selectedNFT } = useNFTStore();

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
      ) : (
        <>
          <div className="gap-2 rounded-2xl bg-white/50 p-4 grid grid-cols-2 mt-2">
        <span className="flex items-center justify-start gap-1.5">
          <h5 className="text-sm font-medium text-mid-grey">Pair:</h5>
          <p className="text-lg tracking-tighter font-medium">
            ETH / USDC (0.3% fee)
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
          <p className="text-lg font-medium">$5,230</p>
        </span>
        <span className="flex items-center justify-start gap-1.5">
          <h5 className="text-sm font-medium text-mid-grey">Fees Acquired:</h5>
          <p className="text-lg font-medium">$125</p>
        </span>
      </div>
      <div className="relative flex flex-col gap-3 w-full">
        <BorrowInput
          type={IOType.loan}
          // amount={outputAmount}
          // asset={outputAsset}
          // onChange={handleOutputAmountChange}
          // loading={loading.output}
          // error={error.outputError}
          // price={tokenPrices.output}
          // timeEstimate={timeEstimate}
        />
      </div>
      <div className="gap-2 rounded-2xl bg-white/75 p-4 grid grid-cols-[1fr_2fr_2fr]">
        <span className="flex items-center justify-start gap-1.5">
          <h5 className="text-sm font-medium text-mid-grey">LTV:</h5>
          <div className="flex items-center gap-1">
            <p className="text-lg font-medium">0.8</p>
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
          <p className="text-lg font-medium">$2,615</p>
        </span>
        <span className="flex items-center justify-start gap-1.5">
          <h5 className="text-sm font-medium text-mid-grey">
            Liquidation Threshold:
          </h5>
          <div className="flex items-center gap-1">
            <p className="text-lg font-medium">$2,350</p>
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
              <p className="text-lg font-medium">{healthFactor}</p>
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
                {![1, 1.2, 1.4, 2].includes(healthFactor) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 rounded-full to-green-500 opacity-20"></div>
                )}
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
              </div>

              {/* HF value indicator */}
              <div
                className="absolute -top-5 transform -translate-x-1/2 text-xs font-medium"
                style={{
                  left: `${Math.min(
                    Math.max(((healthFactor - 1) / (2 - 1)) * 100, 5),
                    95
                  )}%`,
                }}
              >
                {healthFactor}
              </div>

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
          <Button size="lg" className="w-full">
            Borrow
          </Button>
        </>
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center w-full h-full rounded-2xl text-dark-grey">
      Please connect and select a NFT to Borrow
    </div>
  );
};
