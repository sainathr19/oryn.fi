import { useEffect, useRef, useState, type FC } from "react";
import { IOType } from "../../constants/constants";
import clsx from "clsx";
import NumberFlow from "@number-flow/react";
import { TokenInfo } from "../UI/TokenInfo";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../UI/dialog";
import { SelectToken } from "../UI/SelectToken";
import { useAssets } from "../../hooks/useAssets";
import type { Asset } from "../../types/assets";

type BorrowInputType = {
  type: IOType;
};

export const BorrowInput: FC<BorrowInputType> = ({ type }) => {
  const label = type === IOType.collateral ? "Collateral" : "Loan";

  const { assets, chains, loading, error } = useAssets();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedChainName, setSelectedChainName] = useState<string>("sepolia");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (assets.length > 0 && !selectedAsset) {
      const defaultAsset = assets.find(asset => asset.symbol === "USDC") || assets[0];
      setSelectedAsset(defaultAsset);
    }
  }, [assets, selectedAsset]);

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
    setAmount(input);
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
            <div className="flex gap-2">
              {/* {amount && Number(price) !== 0 && ( */}
              <h5 className="text-sm">
                <span className="text-mid-grey">
                  {/* ~${formatAmountUsd(price, 0)} */}
                  $2000
                </span>
              </h5>
              {/* )} */}
            </div>
          </div>
        </div>
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
          <Dialog>
            <DialogTrigger>
              {selectedAsset && chains[selectedChainName] ? (
                <TokenInfo
                  symbol={selectedAsset.symbol}
                  tokenLogo={selectedAsset.logo}
                  chainLogo={chains[selectedChainName].networkLogo}
                  onClick={() => { }}
                />
              ) : loading ? (
                <div className="flex cursor-pointer items-center gap-1">
                  <span>Loading...</span>
                </div>
              ) : error ? (
                <div className="flex cursor-pointer items-center gap-1">
                  <span>Error loading tokens</span>
                </div>
              ) : (
                <div
                  className="flex cursor-pointer items-center gap-1"
                  onClick={() => { }}
                >
                  <span>Select token</span>
                  <ChevronDown className="w-5" />
                </div>
              )}
            </DialogTrigger>
            <DialogContent className="max-w-md w-full">
              <DialogHeader>
                <DialogTitle>Select a token</DialogTitle>
                <DialogDescription>
                  <div className="max-h-96 overflow-y-auto pt-4">
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(chains).map(([chainName, chain]) =>
                        chain.assetConfig.map((asset) => (
                          <SelectToken
                            key={`${chainName}-${asset.tokenAddress}`}
                            asset={{
                              symbol: asset.symbol,
                              logo: asset.logo,
                              network: {
                                networkName: chain.name,
                                chainId: parseInt(chain.chainId),
                                networkLogo: chain.networkLogo,
                              },
                            }}
                            onClick={() => {
                              setSelectedAsset(asset);
                              setSelectedChainName(chainName);
                            }}
                          />
                        ))
                      ).flat()}
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};
