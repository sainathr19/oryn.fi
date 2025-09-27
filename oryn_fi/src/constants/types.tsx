export declare const Chains: {
  readonly bitcoin: "bitcoin";
  readonly bitcoin_testnet: "bitcoin_testnet";
  readonly bitcoin_regtest: "bitcoin_regtest";
  readonly ethereum: "ethereum";
  readonly base: "base";
  readonly arbitrum: "arbitrum";
  readonly ethereum_sepolia: "ethereum_sepolia";
  readonly arbitrum_localnet: "arbitrum_localnet";
  readonly arbitrum_sepolia: "arbitrum_sepolia";
  readonly ethereum_localnet: "ethereum_localnet";
  readonly base_sepolia: "base_sepolia";
  readonly solana: "solana";
  readonly solana_testnet: "solana_testnet";
  readonly solana_localnet: "solana_localnet";
  readonly bera_testnet: "bera_testnet";
  readonly citrea_testnet: "citrea_testnet";
  readonly bera: "bera";
  readonly monad_testnet: "monad_testnet";
  readonly starknet: "starknet";
  readonly starknet_sepolia: "starknet_sepolia";
  readonly starknet_devnet: "starknet_devnet";
  readonly hyperliquid_testnet: "hyperliquid_testnet";
  readonly hyperliquid: "hyperliquid";
  readonly unichain: "unichain";
  readonly corn: "corn";
  readonly botanix: "botanix";
  readonly bnbchain: "bnbchain";
  readonly bnbchain_testnet: "bnbchain_testnet";
  readonly sui: "sui";
  readonly sui_testnet: "sui_testnet";
};

export type Chain = keyof typeof Chains;

export type AssetCommon = {
  name: string;
  decimals: number;
  symbol: string;
  chain: Chain;
  logo?: string;
  atomicSwapAddress: string;
};
export type AssetToken = AssetCommon & {
  tokenAddress: string;
};
