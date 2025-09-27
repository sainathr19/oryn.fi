import React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, polygon, optimism } from '@reown/appkit/networks'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
    throw new Error('Project ID is not defined. Please set VITE_WALLETCONNECT_PROJECT_ID in your .env file')
}

const wagmiAdapter = new WagmiAdapter({
    networks: [mainnet, arbitrum, polygon, optimism],
    projectId,
    ssr: true,
})

const queryClient = new QueryClient()

export const appKit = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [mainnet, arbitrum, polygon, optimism],
    defaultNetwork: mainnet,
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
