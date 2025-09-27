import { BorrowInput } from "./BorrowInput";
import { IOType } from "../../constants/constants";
import { Button } from "../UI/Button";
import { useNFT, type NFTContract } from "../../hooks/useNFT";

export const Kiosk = () => {
  const { nftContracts, isLoading, error, fetchNfts } = useNFT();
  console.log("nftContracts", nftContracts)
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
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Your NFTs</h3>
            <Button 
              size="sm" 
              onClick={fetchNfts}
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
              Error: {error.message}
            </div>
          )}
          
          {isLoading && nftContracts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Loading your NFTs...
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {nftContracts.map((contract: NFTContract) => (
                <div key={contract.address} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Contract: {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {contract.balance.toString()} NFTs
                    </span>
                  </div>
                  
                  {contract.isLoading ? (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      Loading contract NFTs...
                    </div>
                  ) : contract.error ? (
                    <div className="text-red-500 text-sm">
                      Error: {contract.error.message}
                    </div>
                  ) : contract.nfts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {contract.nfts.map((nft) => (
                        <div key={`${nft.contractAddress}-${nft.tokenId}`} 
                             className="border rounded p-2 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                          <div className="text-xs font-medium text-gray-800">
                            #{nft.tokenId}
                          </div>
                          {nft.metadata?.name && (
                            <div className="text-xs text-gray-600 truncate">
                              {nft.metadata.name}
                            </div>
                          )}
                          {nft.metadata?.image && (
                            <img 
                              src={nft.metadata.image} 
                              alt={`NFT #${nft.tokenId}`}
                              className="w-full h-16 object-cover rounded mt-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      No NFTs found in this contract
                    </div>
                  )}
                </div>
              ))}
              
              {nftContracts.length === 0 && !isLoading && (
                <div className="text-center py-4 text-gray-500">
                  No NFT contracts configured
                </div>
              )}
            </div>
          )}
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
