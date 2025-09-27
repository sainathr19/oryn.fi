import React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { sepolia, rootstockTestnet, hederaTestnet, arbitrumSepolia, baseSepolia } from '@reown/appkit/networks'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
    throw new Error('Project ID is not defined. Please set VITE_WALLETCONNECT_PROJECT_ID in your .env file')
}

const wagmiAdapter = new WagmiAdapter({
    networks: [sepolia, rootstockTestnet, hederaTestnet, arbitrumSepolia, baseSepolia],
    projectId,
    ssr: true,
})

const queryClient = new QueryClient()

export const appKit = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [rootstockTestnet, hederaTestnet, sepolia, arbitrumSepolia, baseSepolia],
    defaultNetwork: sepolia,
    features: {
        analytics: true
    }
})

interface WalletProviderProps {
    children: React.ReactNode
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    )
}
