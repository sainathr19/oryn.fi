import { BorrowInput } from "./BorrowInput";
import { IOType } from "../../constants/constants";
import { Button } from "../UI/Button";

export const Kiosk = () => {
  return (
    <div className="flex flex-col items-center w-full max-w-[524px] bg-white/25 z-40 backdrop-blur-lg rounded-2xl border border-white/50 p-1">
      <div className="flex flex-col gap-3 px-2 pb-3 pt-2 sm:px-3 sm:pb-4 sm:pt-3 w-full">
        <div className="relative flex flex-col gap-3 w-full">
          <BorrowInput
            type={IOType.collateral}
            // amount={inputAmount}
            // asset={inputAsset}
            // onChange={handleInputAmountChange}
            // loading={loading.input}
            // price={tokenPrices.input}
            // error={error.inputError}
            // balance={inputTokenBalance}
          />
          {/* <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                onClick={swapAssets}
              >
                <div className="h-8 w-8 origin-center rounded-full border border-light-grey bg-white p-1.5 transition-transform hover:scale-[1.1]"></div>
                <ExchangeIcon className="pointer-events-none absolute bottom-1.5 left-1.5" />
              </div> */}

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
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-4">
          Hello
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
      </div>
    </div>
  );
};
