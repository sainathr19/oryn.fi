import { useNavigate } from "react-router-dom";
import { Button } from "../UI/Button";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-7xl mx-auto font-golos flex items-center justify-between gap-8 pt-36">
      <div className="flex justify-center items-start gap-8 flex-col">
        <h1 className="text-7xl text-dark-grey font-medium -tracking-[30%] w-full leading-[100%]">
          The First CDP Protocol for <br /> Uniswap <em>NFTs.</em>
        </h1>
        <p className="text-lg text-mid-grey w-full">
          Turn your Uniswap V3 liquidity positions (NFTs) into productive
          collateral. Deposit your LP NFT, mint our stablecoin, and access
          liquidity while still earning trading fees from Uniswap. A new era of
          NFT-backed CDPs for DeFi builders and yield farmers.
        </p>
        <Button className="mt-2" onClick={() => navigate("/borrow")}>
          <span className="px-6 py-1.5">Borrow Now</span>
        </Button>
      </div>
      <img src="/bg.png" alt="BG" className="w-[42%] translate-x-12" />
    </section>
  );
};
