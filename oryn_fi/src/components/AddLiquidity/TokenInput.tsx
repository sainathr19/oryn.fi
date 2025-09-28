import { TokenInfo } from "../UI/TokenInfo";
import { useState } from "react";
import NumberFlow from "@number-flow/react";

interface Asset {
    symbol: string;
    name: string;
    logo: string;
    tokenAddress: string;
    decimals?: number;
    chainLogo?: string;
}

interface TokenInputProps {
    label: string;
    tokenData: Asset | null;
    amount: string;
    onAmountChange: (amount: string) => void;
    onTokenClick: () => void;
    onMaxClick: () => void;
    placeholder?: string;
    balance?: string;
    isLoadingBalance?: boolean;
}

export const TokenInput: React.FC<TokenInputProps> = ({
    label,
    tokenData,
    amount,
    onAmountChange,
    onTokenClick,
    onMaxClick,
    placeholder = "0.0",
    balance,
    isLoadingBalance = false
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [animated, setAnimated] = useState(true);

    const handleAmountChange = (value: string) => {
        // Only allow numbers and decimal point
        if (!/^[0-9]*\.?[0-9]*$/.test(value)) {
            setAnimated(false);
            setTimeout(() => setAnimated(true), 800);
            return;
        }

        // Limit decimal places
        const parts = value.split(".");
        if (parts.length === 2 && parts[1].length > (tokenData?.decimals || 18)) {
            value = parts[0] + "." + parts[1].substring(0, tokenData?.decimals || 18);
        }

        setAnimated(false);
        onAmountChange(value);
    };

    return (
        <div className="bg-white/75 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-dark-grey">{label}</h4>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-mid-grey">
                        Balance: {isLoadingBalance ? "..." : balance || "--"}
                    </span>
                    <button
                        onClick={onMaxClick}
                        className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!balance || isLoadingBalance}
                    >
                        MAX
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-dark-grey">
                    {tokenData ? (
                        <TokenInfo
                            symbol={tokenData.symbol}
                            tokenLogo={tokenData.logo}
                            chainLogo={tokenData.chainLogo}
                            onClick={onTokenClick}
                        />
                    ) : (
                        <button
                            onClick={onTokenClick}
                            className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2 hover:bg-white/70 transition-colors"
                        >
                            <span className="text-dark-grey">Loading Asset</span>
                        </button>
                    )}
                </div>
                <div className="relative flex-1 min-w-0">
                    {isFocused ? (
                        <input
                            className="w-full bg-transparent text-right text-2xl font-medium outline-none text-dark-grey min-w-0"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={placeholder}
                        />
                    ) : (
                        <div className="w-full text-right text-2xl font-medium text-dark-grey cursor-pointer min-w-0 overflow-hidden">
                            <NumberFlow
                                value={parseFloat(amount) || 0}
                                locales="en-US"
                                format={{
                                    useGrouping: true,
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: Math.min(tokenData?.decimals || 18, 6),
                                }}
                                className="block truncate"
                                animated={animated}
                                onAnimationsStart={() => setAnimated(false)}
                                onAnimationsFinish={() => setAnimated(true)}
                                onClick={() => setIsFocused(true)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
