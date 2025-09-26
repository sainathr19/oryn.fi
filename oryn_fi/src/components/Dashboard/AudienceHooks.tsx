export const AudienceHooks = () => {
  const audienceHooks = [
    {
      audience: "For LPs",
      hook: "Don't let your NFTs sit idle — borrow stablecoins and amplify returns.",
    },
    {
      audience: "For DeFi Strategists",
      hook: "Leverage your liquidity provisioning without losing fee income.",
    },
    {
      audience: "For Builders",
      hook: "Composable, trustless, NFT-backed credit layer for DeFi.",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto font-golos flex flex-col items-start justify-between gap-8 pb-24">
      <h2 className="text-3xl text-dark-grey font-medium leading-[140%] tracking-tight text-start">
        Audience Hooks
      </h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {audienceHooks.map((hook, index) => (
          <div
            key={index}
            className="flex items-start justify-start w-full rounded-2xl flex-col bg-white shadow-md shadow-primary/5 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <h3 className="text-xl font-medium text-dark-grey">
                {hook.audience}
              </h3>
            </div>
            <p className="text-mid-grey text-md leading-relaxed">{hook.hook}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
