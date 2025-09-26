import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";

export const HiddenValue = () => {
  const hiddenValueStats = [
    {
      icon: DollarSign,
      title: "Total Fees Paid to LPs",
      value: "$4.5B+",
      description:
        "Cumulative trading fees distributed to LPs since Uniswap's inception",
      source: "The Defiant",
    },
    {
      icon: TrendingUp,
      title: "Current TVL",
      value: "$4.5B",
      description: "Total Value Locked across Uniswap (v3 + others)",
      source: "CoinLaw",
    },
    {
      icon: AlertCircle,
      title: "Inactive Liquidity",
      value: "Significant",
      description:
        "LP capital often sits idle (outside active price range), earning no fees until price returns to range",
      source: "Uniswap Docs",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto font-golos flex flex-col items-start justify-between gap-8 pb-24">
      <h2 className="text-3xl text-dark-grey font-medium leading-[140%] tracking-tight text-start">
        Uniswap LP values that speaks for them selves
      </h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hiddenValueStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="flex items-start justify-start w-full rounded-2xl flex-col bg-white shadow-md shadow-primary/5 p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-dark-grey">
                    {stat.title}
                  </h3>
                  <p className="text-sm text-mid-grey">{stat.source}</p>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-5xl font-semibold text-primary">
                  {stat.value}
                </span>
              </div>
              <p className="text-mid-grey text-md leading-relaxed">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
