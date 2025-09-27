import React from "react";
import { cn } from "../../utils/utils";
import { ChevronDown } from "lucide-react";
import { TokenNetworkLogos } from "./TokenNetworkLogos";

type TokenInfoProps = {
  symbol: string;
  tokenLogo: string;
  chainLogo?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const TokenInfo: React.FC<TokenInfoProps> = ({
  symbol,
  tokenLogo,
  chainLogo,
  className,
  ...props
}) => {
  return (
    <div
      className={cn("flex text-left cursor-pointer w-max", className)}
      {...props}
    >
      <button className="flex flex-row justify-center items-center gap-2 pt-2 w-full focus:outline-none">
        <span className="text-2xl font-regular -tracking-[0.1rem]">
          {symbol}
        </span>
        <div className={`flex items-center`}>
          <TokenNetworkLogos
            tokenLogo={tokenLogo || ""}
            chainLogo={chainLogo || ""}
          />
          <span>
            <ChevronDown />
          </span>
        </div>
      </button>
    </div>
  );
};
