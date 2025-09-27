import { useEffect, useRef, useState, type FC } from "react";
import { IOType } from "../../constants/constants";
import clsx from "clsx";
import NumberFlow from "@number-flow/react";
import { TokenInfo } from "../UI/TokenInfo";
import { validateBorrowAmount } from "../../utils/borrowCalculations";

type BorrowInputType = {
  type: IOType;
  maxValue?: number;
  onAmountChange?: (amount: bigint) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
};

export const BorrowInput: FC<BorrowInputType> = ({ 
  type, 
  maxValue, 
  onAmountChange, 
  onValidationChange 
}) => {
  const label = type === IOType.collateral ? "Collateral" : "Loan Amount";

  // Static OrynUSD asset data
  const orynUSDAsset = {
    symbol: "OrynUSD",
    logo: "https://garden.imgix.net/ethglobal/OrynUSDC.svg",
    decimals: 18
  };

  const [amount, setAmount] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const [isFocused, setIsFocused] = useState(false);
  const [animated, setAnimated] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLoadingOpacity] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Strict validation: only allow numbers and a single decimal point
    if (!/^[0-9]*\.?[0-9]*$/.test(input)) {
      setAnimated(false);
      setTimeout(() => {
        setAnimated(true);
      }, 800);
      return;
    }
    setAnimated(false);

    if (input.startsWith(".")) {
      input = "0" + input;
    }

    const parts = input.split(".");
    if (input === "-") return;

    // If there's more than one decimal point, reject the input
    if (parts.length > 2) {
      setTimeout(() => {
        setAnimated(true);
      }, 800);
      return;
    }

    // Limit decimal places to 18 (OrynUSD decimals)
    if (parts.length === 2 && parts[1].length > 18) {
      input = parts[0] + "." + parts[1].substring(0, 18);
    }

    setAmount(input);

    // Validate the amount and notify parent component
    const numericAmount = parseFloat(input) || 0;
    if (maxValue && numericAmount > 0) {
      const validation = validateBorrowAmount(numericAmount, maxValue);
      setValidationError(validation.error || null);
      onValidationChange?.(validation.isValid, validation.error);
    } else {
      setValidationError(null);
      onValidationChange?.(true);
    }
    
    // Convert to 18 decimals for blockchain operations
    const amountWithDecimals = BigInt(numericAmount * Math.pow(10, 18));
    onAmountChange?.(amountWithDecimals);
  };

  useEffect(() => {
    setAnimated(true);
  }, [isFocused]);

  // Show loading opacity when loading
  // useEffect(() => {
  // let timeoutId: ReturnType<typeof setTimeout>;
  // if (loading) {
  //   timeoutId = setTimeout(() => {
  //     setShowLoadingOpacity(true);
  //   }, 300);
  // } else {
  // setShowLoadingOpacity(false);
  // }
  // return () => {
  // if (timeoutId) clearTimeout(timeoutId);
  // };
  // }, [loading]);

  return (
    <>
      <div className="flex flex-col gap-2 rounded-2xl bg-white/75 w-full p-4 pb-5 text-dark-grey">
        <div className="flex justify-between">
          <div className="flex gap-3">
            <h4 className="text-sm font-medium">{label}</h4>
            {maxValue && (
              <h5 className="text-sm">
                <span className="text-mid-grey">
                  Max: ${maxValue.toFixed(2)}
                </span>
              </h5>
            )}
          </div>
        </div>
        {validationError && (
          <div className="text-red-500 text-xs mt-1">
            {validationError}
          </div>
        )}
        <div className="flex h-5 justify-between sm:h-7">
          <span className="text-2xl font-medium">
            <div className="relative w-[150px] max-w-[150px] md:w-[200px] md:max-w-[200px]">
              <div
                className={clsx(
                  "relative flex w-full items-center",
                  !isAnimating && "cursor-text"
                )}
                onClick={(e) => {
                  if (isAnimating) return;
                  e.preventDefault();
                  setIsFocused(true);
                  // Use setTimeout to ensure the input is mounted before focusing
                  setTimeout(() => {
                    inputRef.current?.focus();
                  }, 0);
                }}
              >
                {isFocused ? (
                  <input
                    ref={inputRef}
                    className={clsx(
                      "w-full bg-transparent py-[1px] text-start font-[inherit] outline-none",
                      isAnimating && "pointer-events-none"
                    )}
                    style={{ fontKerning: "none" }}
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => handleAmountChange(e)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                ) : (
                  <NumberFlow
                    value={Number(amount) || 0}
                    locales="en-US"
                    style={{ fontKerning: "none", width: "100%" }}
                    format={{
                      useGrouping: false,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 20,
                    }}
                    aria-hidden="true"
                    animated={animated}
                    onAnimationsStart={() => {
                      setIsAnimating(true);
                    }}
                    onAnimationsFinish={() => {
                      setIsAnimating(false);
                    }}
                    className={`w-full text-start font-[inherit] tracking-normal duration-200 ease-in-out ${showLoadingOpacity ? "opacity-75" : ""
                      }`}
                    willChange
                  />
                )}
              </div>
            </div>
          </span>
          {/* Static OrynUSD display - no modal needed */}
          <TokenInfo
            symbol={orynUSDAsset.symbol}
            tokenLogo={orynUSDAsset.logo}
            onClick={() => { }}
          />
        </div>
      </div>
    </>
  );
};

