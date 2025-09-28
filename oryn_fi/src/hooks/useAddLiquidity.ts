import { useState, useCallback, useMemo } from "react";
import { useWalletClient } from "wagmi";
import {
    getContract,
    type Client,
    type Address,
    type Hash
} from "viem";
import { writeContract, waitForTransactionReceipt, readContract } from "viem/actions";
import { contractAddresses } from "../constants/constants";
import { erc20Abi } from "viem";

const UNISWAP_V4_POOL_MANAGER_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "currency0",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "currency1",
                "type": "address"
            },
            {
                "internalType": "uint24",
                "name": "fee",
                "type": "uint24"
            },
            {
                "internalType": "int24",
                "name": "tickSpacing",
                "type": "int24"
            },
            {
                "internalType": "address",
                "name": "hooks",
                "type": "address"
            }
        ],
        "name": "initialize",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "id",
                "type": "bytes32"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "currency0",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "currency1",
                "type": "address"
            },
            {
                "internalType": "uint24",
                "name": "fee",
                "type": "uint24"
            },
            {
                "internalType": "int24",
                "name": "tickLower",
                "type": "int24"
            },
            {
                "internalType": "int24",
                "name": "tickUpper",
                "type": "int24"
            },
            {
                "internalType": "uint256",
                "name": "amount0",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amount1",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "hookData",
                "type": "bytes"
            }
        ],
        "name": "modifyPosition",
        "outputs": [
            {
                "internalType": "BalanceDelta",
                "name": "delta",
                "type": "int256"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

interface AddLiquidityParams {
    tokenA: Address;
    tokenB: Address;
    amountA: bigint;
    amountB: bigint;
    fee: number;
    tickLower?: number;
    tickUpper?: number;
}

export const useAddLiquidity = () => {
    const { data: walletClient } = useWalletClient();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const poolManagerContract = useMemo(() => {
        if (!walletClient) return null;

        return getContract({
            abi: UNISWAP_V4_POOL_MANAGER_ABI,
            address: contractAddresses.UNI_V4_POSITION_MANAGER_ADDRESS,
            client: walletClient as Client,
        });
    }, [walletClient]);

    const approveToken = useCallback(async (
        tokenAddress: Address,
        spender: Address,
        amount: bigint
    ): Promise<Hash> => {
        if (!walletClient) throw new Error("Wallet not connected");

        getContract({
            abi: erc20Abi,
            address: tokenAddress,
            client: walletClient as Client,
        });

        const currentAllowance = await readContract(walletClient, {
            abi: erc20Abi,
            address: tokenAddress,
            functionName: "allowance",
            args: [walletClient.account.address, spender],
        });

        if (currentAllowance >= amount) {
            return "0x" as Hash;
        }

        const approveHash = await writeContract(walletClient, {
            abi: erc20Abi,
            address: tokenAddress,
            functionName: "approve",
            args: [spender, amount],
        });

        await waitForTransactionReceipt(walletClient, {
            hash: approveHash,
        });

        return approveHash;
    }, [walletClient]);

    const addLiquidity = useCallback(async (params: AddLiquidityParams): Promise<{ hash: Hash }> => {
        if (!walletClient || !poolManagerContract) {
            throw new Error("Wallet or contract not available");
        }

        setIsLoading(true);
        setError(null);

        try {
            const {
                tokenA,
                tokenB,
                amountA,
                amountB,
                fee,
                tickLower = -887220,
                tickUpper = 887220,
            } = params;

            const [currency0, currency1, amount0, amount1] =
                tokenA.toLowerCase() < tokenB.toLowerCase()
                    ? [tokenA, tokenB, amountA, amountB]
                    : [tokenB, tokenA, amountB, amountA];

            await approveToken(currency0, contractAddresses.UNI_V4_POSITION_MANAGER_ADDRESS, amount0);
            await approveToken(currency1, contractAddresses.UNI_V4_POSITION_MANAGER_ADDRESS, amount1);

            const hash = await writeContract(walletClient, {
                abi: UNISWAP_V4_POOL_MANAGER_ABI,
                address: contractAddresses.UNI_V4_POSITION_MANAGER_ADDRESS,
                functionName: "modifyPosition",
                args: [
                    currency0,
                    currency1,
                    fee,
                    tickLower,
                    tickUpper,
                    amount0,
                    amount1,
                    "0x"
                ],
            });

            await waitForTransactionReceipt(walletClient, {
                hash,
            });

            return { hash };

        } catch (err: any) {
            const errorMessage = err.message || "Failed to add liquidity";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [walletClient, poolManagerContract, approveToken]);

    const getPoolInfo = useCallback(async (
        _tokenA: Address,
        _tokenB: Address,
        _fee: number
    ) => {
        if (!walletClient) throw new Error("Wallet not connected");

        try {
            return {
                liquidity: 0n,
                sqrtPriceX96: 0n,
                tick: 0,
                feeGrowthGlobal0X128: 0n,
                feeGrowthGlobal1X128: 0n,
            };
        } catch (err: any) {
            throw new Error(`Failed to get pool info: ${err.message}`);
        }
    }, [walletClient]);

    const calculateOptimalAmounts = useCallback(async (
        _tokenA: Address,
        _tokenB: Address,
        amountA: bigint,
        _fee: number
    ) => {
        if (!walletClient) throw new Error("Wallet not connected");

        try {
            return {
                amount0: amountA,
                amount1: amountA,
            };
        } catch (err: any) {
            throw new Error(`Failed to calculate optimal amounts: ${err.message}`);
        }
    }, [walletClient]);

    return {
        addLiquidity,
        getPoolInfo,
        calculateOptimalAmounts,
        isLoading,
        error,
    };
};
