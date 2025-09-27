export const Explain = () => {
  return (
    <section className="max-w-7xl mx-auto font-golos flex flex-col items-center justify-between gap-16 py-36">
      <h2 className="text-3xl text-dark-grey font-regular leading-[140%] tracking-tight">
        Traditional CDPs use fungible assets like ETH or stablecoins as
        collateral. But Uniswap V3 introduced concentrated liquidity positions
        represented as NFTs, leaving billions in idle, locked liquidity that
        can't be directly borrowed against.
      </h2>
      <div className="w-full grid grid-cols-3 gap-6">
        <div className="flex items-center justify-center w-full rounded-2xl flex-col bg-white shadow-md shadow-primary/5 pb-10">
          <img src="/Icon1.png" alt="" className="h-58" />
          <h3 className="text-xl font-medium mt-1">NFT-backed CDPs</h3>
          <p className="text-mid-grey text-md">
            Use Uniswap LP NFTs as collateral.
          </p>
        </div>
        <div className="flex items-center justify-center w-full rounded-2xl flex-col bg-white shadow-md shadow-primary/5 pb-10">
          <img src="/Icon2.png" alt="" className="h-58" />
          <h3 className="text-xl font-medium mt-1">Capital Efficiency</h3>
          <p className="text-mid-grey text-md">
            Access liquidity while earning fees.
          </p>
        </div>
        <div className="flex items-center justify-center w-full rounded-2xl flex-col bg-white shadow-md shadow-primary/5 pb-10">
          <img src="/Icon3.png" alt="" className="h-58" />
          <h3 className="text-xl font-medium mt-1">Stable & Composable</h3>
          <p className="text-mid-grey text-md">
            Borrow a stablecoin usable across DeFi.
          </p>
        </div>
      </div>
    </section>
  );
};
