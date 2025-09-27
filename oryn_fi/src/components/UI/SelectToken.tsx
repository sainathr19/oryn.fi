import type { FC } from "react";
import { TokenNetworkLogos } from "./TokenNetworkLogos";

type SelectTokenType = {
  asset: {
    symbol: string;
    logo: string;
    network: {
      networkName: string;
      networkLogo: string;
    };
  };
};

export const SelectToken: FC<SelectTokenType> = ({ asset }) => {
  return (
    <div className="p-4 bg-white/50 rounded-2xl flex items-center gap-2 w-full justify-between hover:bg-white hover:scale-[101%] transition-all duration-200 ease-in-out cursor-pointer">
      <div className="flex items-center gap-2">
        <TokenNetworkLogos
          tokenLogo={asset.logo || ""}
          chainLogo={asset.network?.networkLogo}
        />
        <span className="text-xl font-regular tracking-tighter">
          {asset.symbol}
        </span>
      </div>
      <span className="text-xl font-regular text-mid-grey/60 tracking-tighter">
        {asset.network.networkName}
      </span>
    </div>
  );
};
