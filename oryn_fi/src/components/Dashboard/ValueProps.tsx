export const ValueProps = () => {
  const valueProps = [
    {
      title: "NFT-backed Borrowing",
      description: "First protocol to enable CDPs with Uniswap NFTs.",
    },
    {
      title: "Capital Efficiency",
      description: "Access liquidity without unwinding LP positions.",
    },
    {
      title: "Stablecoin Minting",
      description: "Borrow a native stable asset pegged to USD.",
    },
    {
      title: "Fee Retention",
      description: "Continue earning Uniswap LP fees while collateralized.",
    },
    {
      title: "Composable DeFi",
      description: "Use borrowed stablecoins across DeFi ecosystem.",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto font-golos flex flex-col items-start justify-between gap-8 pb-16">
      <h2 className="text-3xl text-dark-grey font-medium leading-[140%] tracking-tight text-start">
        Core Value Propositions
      </h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {valueProps.map((prop, index) => (
          <div
            key={index}
            className="flex items-start justify-start w-full rounded-2xl flex-col bg-white shadow-md shadow-primary/5 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <h3 className="text-xl font-medium text-dark-grey">
                {prop.title}
              </h3>
            </div>
            <p className="text-mid-grey text-md leading-relaxed">
              {prop.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
