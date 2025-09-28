import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../UI/dialog";
import { TokenNetworkLogos } from "../UI/TokenNetworkLogos";

interface Asset {
    symbol: string;
    name: string;
    logo: string;
    tokenAddress: string;
    chainName?: string;
    chainLogo?: string;
}

interface TokenSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assets: Asset[];
    onTokenSelect: (symbol: string) => void;
    title?: string;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
    open,
    onOpenChange,
    assets,
    onTokenSelect,
    title = "Select a token"
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-96">
                <DialogHeader>
                    <DialogTitle className="text-dark-grey">{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {assets.map((asset) => (
                        <button
                            key={`${asset.symbol}-${asset.tokenAddress}`}
                            onClick={() => onTokenSelect(asset.symbol)}
                            className="w-full p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <TokenNetworkLogos
                                    tokenLogo={asset.logo}
                                    chainLogo={asset.chainLogo}
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-dark-grey">{asset.symbol}</div>
                                    <div className="text-sm text-mid-grey">{asset.name}</div>
                                    {asset.chainName && (
                                        <div className="text-xs text-mid-grey">{asset.chainName}</div>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};
