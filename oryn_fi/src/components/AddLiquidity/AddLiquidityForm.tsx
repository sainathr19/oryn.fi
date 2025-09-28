import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAssets } from "../../hooks/useAssets";
import { useContracts } from "../../hooks/useContracts";
import { Button } from "../UI/Button";
import { Settings } from "lucide-react";
import { TokenSelector } from "./TokenSelector";
import { TokenInput } from "./TokenInput";
import { OptionSelector } from "./OptionSelector";
import { StatusMessage } from "./StatusMessage";
import clsx from "clsx";

const FEE_TIERS = [
    { label: "0.01%", value: 100, description: "Best for stable pairs" },
    { label: "0.05%", value: 500, description: "Best for stable pairs" },
    { label: "0.3%", value: 3000, description: "Best for most pairs" },
    { label: "1%", value: 10000, description: "Best for exotic pairs" },
] as const;

const PRICE_RANGE_OPTIONS = [
    { label: "Full Range", value: "full", description: "Provide liquidity across all prices" },
    { label: "Custom Range", value: "custom", description: "Set your own price range" },
] as const;

interface AddLiquidityFormProps {
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export const AddLiquidityForm: React.FC<AddLiquidityFormProps> = ({
    isLoading,
    setIsLoading
}) => {
    const { address } = useAccount();
    const { assets } = useAssets();
    const {
        fetchTokenBalances,
        getFormattedTokenBalance,
        isLoadingBalances,
        balanceError
    } = useContracts();

    // Token selection state
    const [tokenA, setTokenA] = useState<string | null>(null);
    const [tokenB, setTokenB] = useState<string | null>(null);
    const [showTokenSelectorA, setShowTokenSelectorA] = useState(false);
    const [showTokenSelectorB, setShowTokenSelectorB] = useState(false);

    // Amount state
    const [amountA, setAmountA] = useState("");
    const [amountB, setAmountB] = useState("");

    // Fee and range state
    const [selectedFeeTier, setSelectedFeeTier] = useState<typeof FEE_TIERS[number]>(FEE_TIERS[2]); // Default to 0.3%
    const [priceRangeType, setPriceRangeType] = useState<"full" | "custom">("full");
    const [tickLower, setTickLower] = useState<number>(-887220);
    const [tickUpper, setTickUpper] = useState<number>(887220);

    // Settings state
    const [slippageTolerance, setSlippageTolerance] = useState(0.5); // 0.5%
    const [deadline, setDeadline] = useState(20); // 20 minutes
    const [showSettings, setShowSettings] = useState(false);

    // UI state - removed unused focus/animation states (now handled in TokenInput component)

    // Transaction state
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Price and ratio state
    const [priceRatio, setPriceRatio] = useState(1);

    // Initialize tokens with first available assets
    useEffect(() => {
        if (assets.length > 0) {
            if (!tokenA) setTokenA(assets[0].symbol);
            if (!tokenB && assets.length > 1) setTokenB(assets[1].symbol);
        }
    }, [assets, tokenA, tokenB]);

    // Fetch token balances when assets are loaded
    useEffect(() => {
        if (assets.length > 0 && address) {
            fetchTokenBalances(assets);
        }
    }, [assets, address, fetchTokenBalances]);

    // Calculate price ratio (simplified - in real app you'd get this from price feeds)
    useEffect(() => {
        // This is a mock price ratio - replace with actual price fetching
        setPriceRatio(2000); // 1 ETH = 2000 USDC
    }, [tokenA, tokenB]);

    // Auto-calculate amountB when amountA changes
    useEffect(() => {
        if (amountA && priceRatio) {
            const calculatedB = (parseFloat(amountA) / priceRatio).toString();
            setAmountB(calculatedB);
        }
    }, [amountA, priceRatio]);

    // Get current token data
    const getTokenData = (symbol: string | null) => {
        return assets.find(asset => asset.symbol === symbol) || null;
    };

    const tokenAData = getTokenData(tokenA);
    const tokenBData = getTokenData(tokenB);


    const handleTokenSelect = (symbol: string, isTokenA: boolean) => {
        // Find the asset by symbol to get full asset data
        const selectedAsset = assets.find(asset => asset.symbol === symbol);
        if (selectedAsset) {
            if (isTokenA) {
                setTokenA(symbol);
                setShowTokenSelectorA(false);
            } else {
                setTokenB(symbol);
                setShowTokenSelectorB(false);
            }
        }
    };

    const handleMaxAmount = (isTokenA: boolean) => {
        const tokenData = isTokenA ? tokenAData : tokenBData;
        if (tokenData) {
            const balance = getFormattedTokenBalance(tokenData.tokenAddress, tokenData.decimals);
            if (isTokenA) {
                setAmountA(balance);
            } else {
                setAmountB(balance);
            }
        }
    };

    const handleAddLiquidity = async () => {
        if (!address || !amountA || !amountB || !tokenA || !tokenB) {
            setError("Please select tokens and enter amounts");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setSuccess(false);

            // For now, simulate a transaction
            await new Promise(resolve => setTimeout(resolve, 2000));

            setTxHash("0x1234567890abcdef1234567890abcdef12345678");
            setSuccess(true);

            // Reset form
            setAmountA("");
            setAmountB("");

        } catch (err: any) {
            setError(err.message || "Failed to add liquidity");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Settings */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-medium text-dark-grey">Add Liquidity</h2>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    <Settings className="w-5 h-5 text-mid-grey" />
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-4 border border-border">
                    <h3 className="text-lg font-medium text-dark-grey">Transaction Settings</h3>

                    {/* Slippage Tolerance */}
                    <div className="space-y-2">
                        <label className="text-sm text-mid-grey">Slippage Tolerance</label>
                        <div className="flex gap-2">
                            {[0.1, 0.5, 1.0].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => setSlippageTolerance(value)}
                                    className={clsx(
                                        "px-3 py-1 rounded-lg text-sm transition-colors",
                                        slippageTolerance === value
                                            ? "bg-primary text-white"
                                            : "bg-white text-mid-grey hover:bg-gray-100 border border-border"
                                    )}
                                >
                                    {value}%
                                </button>
                            ))}
                            <input
                                type="number"
                                value={slippageTolerance}
                                onChange={(e) => setSlippageTolerance(parseFloat(e.target.value) || 0)}
                                className="px-3 py-1 rounded-lg bg-white text-dark-grey text-sm w-20 border border-border"
                                placeholder="Custom"
                                step="0.1"
                                min="0"
                                max="50"
                            />
                        </div>
                    </div>

                    {/* Deadline */}
                    <div className="space-y-2">
                        <label className="text-sm text-mid-grey">Transaction Deadline</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={deadline}
                                onChange={(e) => setDeadline(parseInt(e.target.value) || 20)}
                                className="px-3 py-2 rounded-lg bg-white text-dark-grey w-24 border border-border"
                                min="1"
                                max="4320"
                            />
                            <span className="text-mid-grey text-sm">minutes</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <TokenInput
                    label="Token A"
                    tokenData={tokenAData}
                    amount={amountA}
                    onAmountChange={setAmountA}
                    onTokenClick={() => setShowTokenSelectorA(true)}
                    onMaxClick={() => handleMaxAmount(true)}
                    balance={tokenAData ? getFormattedTokenBalance(tokenAData.tokenAddress, tokenAData.decimals) : undefined}
                    isLoadingBalance={isLoadingBalances}
                />

                <TokenInput
                    label="Token B"
                    tokenData={tokenBData}
                    amount={amountB}
                    onAmountChange={setAmountB}
                    onTokenClick={() => setShowTokenSelectorB(true)}
                    onMaxClick={() => handleMaxAmount(false)}
                    balance={tokenBData ? getFormattedTokenBalance(tokenBData.tokenAddress, tokenBData.decimals) : undefined}
                    isLoadingBalance={isLoadingBalances}
                />
            </div>

            <OptionSelector
                title="Select Fee Tier"
                options={FEE_TIERS}
                selectedValue={selectedFeeTier.value}
                onSelect={(value) => {
                    const tier = FEE_TIERS.find(t => t.value === value);
                    if (tier) setSelectedFeeTier(tier);
                }}
            />

            <OptionSelector
                title="Price Range"
                options={PRICE_RANGE_OPTIONS}
                selectedValue={priceRangeType}
                onSelect={(value) => setPriceRangeType(value as "full" | "custom")}
            />

            {priceRangeType === "custom" && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-4 border border-border">
                    <h4 className="text-dark-grey font-medium">Custom Price Range</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-mid-grey text-sm block mb-2">Min Price</label>
                            <input
                                type="number"
                                value={tickLower}
                                onChange={(e) => setTickLower(parseInt(e.target.value) || -887220)}
                                className="w-full px-3 py-2 rounded-lg bg-white text-dark-grey border border-border"
                                placeholder="Min tick"
                            />
                        </div>
                        <div>
                            <label className="text-mid-grey text-sm block mb-2">Max Price</label>
                            <input
                                type="number"
                                value={tickUpper}
                                onChange={(e) => setTickUpper(parseInt(e.target.value) || 887220)}
                                className="w-full px-3 py-2 rounded-lg bg-white text-dark-grey border border-border"
                                placeholder="Max tick"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3 text-center border border-border">
                <p className="text-mid-grey text-sm">
                    1 {tokenA} = {(1 / priceRatio).toFixed(6)} {tokenB}
                </p>
                <p className="text-mid-grey text-sm">
                    1 {tokenB} = {priceRatio.toFixed(2)} {tokenA}
                </p>
                {tokenAData?.chainName && tokenBData?.chainName && (
                    <p className="text-xs text-mid-grey mt-1">
                        {tokenAData.chainName} ↔ {tokenBData.chainName}
                    </p>
                )}
            </div>

            {(amountA || amountB) && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-border">
                    <h4 className="text-dark-grey font-medium">Transaction Summary</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-mid-grey">
                            <span>Token Pair:</span>
                            <span>{tokenA} / {tokenB}</span>
                        </div>
                        {tokenAData?.chainName && tokenBData?.chainName && (
                            <div className="flex justify-between text-mid-grey">
                                <span>Chains:</span>
                                <span>{tokenAData.chainName} ↔ {tokenBData.chainName}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-mid-grey">
                            <span>Fee Tier:</span>
                            <span>{selectedFeeTier.label}</span>
                        </div>
                        <div className="flex justify-between text-mid-grey">
                            <span>Price Range:</span>
                            <span>{priceRangeType === "full" ? "Full Range" : "Custom"}</span>
                        </div>
                        <div className="flex justify-between text-mid-grey">
                            <span>Slippage:</span>
                            <span>{slippageTolerance}%</span>
                        </div>
                        <div className="flex justify-between text-mid-grey">
                            <span>Deadline:</span>
                            <span>{deadline} minutes</span>
                        </div>
                    </div>
                </div>
            )}

            <Button
                onClick={handleAddLiquidity}
                disabled={isLoading || !amountA || !amountB || !tokenA || !tokenB}
                className="w-full py-4 rounded-2xl font-semibold text-lg"
            >
                {isLoading ? "Adding Liquidity..." : "Add Liquidity"}
            </Button>

            <TokenSelector
                open={showTokenSelectorA}
                onOpenChange={setShowTokenSelectorA}
                assets={assets}
                onTokenSelect={(symbol) => handleTokenSelect(symbol, true)}
                title="Select a token"
            />

            <TokenSelector
                open={showTokenSelectorB}
                onOpenChange={setShowTokenSelectorB}
                assets={assets}
                onTokenSelect={(symbol) => handleTokenSelect(symbol, false)}
                title="Select a token"
            />

            {balanceError && (
                <StatusMessage
                    type="error"
                    message={`Failed to load token balances: ${balanceError.message}`}
                />
            )}

            {error && (
                <StatusMessage
                    type="error"
                    message={error}
                />
            )}

            {success && txHash && (
                <StatusMessage
                    type="success"
                    message="Liquidity added successfully!"
                    details={`Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`}
                />
            )}
        </div>
    );
};
