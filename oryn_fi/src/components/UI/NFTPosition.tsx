export const NFTPosition = () => {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/75 backdrop-blur-md p-4 hover:bg-white hover:scale-[101%] transition-all duration-200 ease-in-out cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between gap-3">
          <h5 className="text-md tracking-tighter flex font-medium items-center gap-1">
            <div className="w-4 h-4 inline-flex rounded-sm bg-primary/20 mr-1" />
            ETH{" "}
            <span className="inline-flex min-w-2 min-h-2 bg-primary rounded-full" />{" "}
            USDC
          </h5>
          <p className="text-xs text-light-grey">#12345</p>
        </div>
        <span className="text-xs items-center flex justify-center px-3 py-1 bg-primary/80 rounded-full text-white">
          Available
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-medium text-dark-grey tracking-tighter">
          $5,230
        </span>
        <div className="text-xs text-mid-grey pb-0.5">Fee Tier: 0.3%</div>
      </div>
    </div>
  );
};
