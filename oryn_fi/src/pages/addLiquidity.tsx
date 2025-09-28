import { useState } from "react";
import { useAccount } from "wagmi";
import { AddLiquidityForm } from "../components/AddLiquidity/AddLiquidityForm";
import { WalletConnectButton } from "../components/UI/WalletConnect";

export const AddLiquidity = () => {
    const { isConnected } = useAccount();
    const [isLoading, setIsLoading] = useState(false);

    if (!isConnected) {
        return (
            <div className="relative h-screen w-screen ">
                <div
                    className="fixed bottom-0 z-[1] h-full max-h-[612px] w-screen origin-bottom overflow-hidden opacity-60"
                    style={{
                        background:
                            "linear-gradient(180deg, rgba(188, 237, 220, 0) 0%, #A27FE6 100%)",
                    }}
                />
                <img
                    src="/bgwall.png"
                    alt="background"
                    className="w-screen absolute inset-0 h-screen object-cover"
                />
                <div className="absolute grid max-w-7xl gap-6 px-6 mx-auto items-center justify-center inset-0 w-screen text-white my-auto pt-20">
                    <div className="flex flex-col items-center h-full max-h-[75%] w-full bg-primary/5 z-40 backdrop-blur-lg rounded-2xl border border-white/50 p-8 text-center overflow-y-auto">
                        <h2 className="text-3xl font-medium text-dark-grey mb-4">Connect Your Wallet</h2>
                        <p className="text-mid-grey mb-6">Please connect your wallet to add liquidity</p>
                        <WalletConnectButton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-screen">
            <div
                className="fixed bottom-0 z-[1] h-full max-h-[612px] w-screen origin-bottom overflow-hidden opacity-60"
                style={{
                    background:
                        "linear-gradient(180deg, rgba(188, 237, 220, 0) 0%, #A27FE6 100%)",
                }}
            />
            <img
                src="/bgwall.png"
                alt="background"
                className="w-screen absolute inset-0 h-screen object-cover"
            />
            <div className="absolute grid max-w-7xl gap-6 px-6 mx-auto items-center justify-center inset-0 w-screen text-white my-auto">
                <div className="flex flex-col items-center h-full max-h-[80%] w-full bg-primary/5 z-40 backdrop-blur-lg rounded-2xl border border-white/50 p-6 overflow-y-auto">
                    <AddLiquidityForm
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                    />
                </div>
            </div>
        </div>
    );
};
