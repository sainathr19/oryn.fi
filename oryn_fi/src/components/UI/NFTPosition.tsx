import { useNFTStore } from '../../stores/nftStore';
import { formatUSDValue } from '../../utils/tokenMetadata';

interface NFTPositionProps {
  tokenId?: number;
}

export const NFTPosition = ({ tokenId }: NFTPositionProps) => {
  const { selectedNFT, setSelectedNFT, allNFTDetails } = useNFTStore();
  
  const isSelected = selectedNFT.tokenId === tokenId;
  
  const nftDetails = allNFTDetails[tokenId || 0];

  const handleClick = () => {
    if (!tokenId) return;
    setSelectedNFT(tokenId);
    
    // Also set the position details for the selected NFT
    if (nftDetails) {
      const { setPositionDetails, setTokenMetadata } = useNFTStore.getState();
      setPositionDetails(nftDetails.positionDetails);
      setTokenMetadata(nftDetails.token0Metadata, nftDetails.token1Metadata);
    }
  };

  return (
    <div 
      className={`flex flex-col gap-3 rounded-2xl backdrop-blur-md p-4 hover:bg-primary/10 transition-all duration-200 ease-in-out cursor-pointer ${
        isSelected 
          ? 'bg-primary/20 border-2 border-primary' 
          : 'bg-white/75 hover:bg-white'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between gap-3">
          <h5 className="text-md tracking-tighter flex font-medium items-center gap-1">
            {nftDetails ? (
              <>
                {nftDetails.token0Metadata.symbol}{" "}
                <span className="inline-flex min-w-2 min-h-2 bg-primary rounded-full" />{" "}
                {nftDetails.token1Metadata.symbol}
              </>
            ) : (
              <>
                <div className="w-4 h-4 inline-flex rounded-sm bg-primary/20 mr-1" />
                ETH{" "}
                <span className="inline-flex min-w-2 min-h-2 bg-primary rounded-full" />{" "}
                USDC
              </>
            )}
          </h5>
          <p className={`text-xs ${isSelected ? 'text-primary font-medium' : 'text-light-grey'}`}>
            #{tokenId || 'Loading...'}
          </p>
        </div>
        <span className="text-xs items-center flex justify-center px-3 py-1 bg-primary/80 rounded-full text-white">
          Available
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-medium text-dark-grey tracking-tighter">
          {nftDetails ? 
            formatUSDValue(nftDetails.positionDetails.totalValueUSD) : 
            '$5,230'
          }
        </span>
        <div className="text-xs text-mid-grey pb-0.5">
          Fee Tier: {nftDetails ? 
            `${nftDetails.positionDetails.fee / 10000}%` : 
            '0.3%'
          }
        </div>
      </div>
    </div>
  );
};
