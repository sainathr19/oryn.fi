import type { FC, HTMLAttributes } from "react";

type TokenNetworkLogosProps = HTMLAttributes<HTMLDivElement> & {
  tokenLogo?: string;
  chainLogo?: string;
  className?: string;
  iconStyle?: string;
};

export const TokenNetworkLogos: FC<TokenNetworkLogosProps> = ({
  tokenLogo,
  chainLogo,
  className,
  iconStyle,
  ...rest
}) => {
  return (
    <div
      className={`relative flex h-5 items-center justify-between  ${
        chainLogo && chainLogo !== tokenLogo ? "w-[36px]" : "w-5"
      } ${className ?? ""}`}
      {...rest}
    >
      <img
        src={tokenLogo}
        className={`absolute left-0 z-30 h-5 w-5 rounded-full shadow-xs shadow-mid-grey/30 ${
          iconStyle ?? ""
        }`}
      />
      {chainLogo && chainLogo !== tokenLogo && (
        <img
          src={chainLogo}
          className={`absolute right-0 z-20 h-5 w-5 rounded-full shadow-xs shadow-mid-grey/30 ${
            iconStyle ?? ""
          }`}
        />
      )}
    </div>
  );
};
