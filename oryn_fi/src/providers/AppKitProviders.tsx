import { createAppKit } from '@reown/appkit/react'

import { WagmiProvider } from 'wagmi'
import {   baseSepolia,  sepolia, arbitrumSepolia,type AppKitNetwork } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

const queryClient = new QueryClient()

const projectId = import.meta.env.VITE_APPKIT_ID;

const metadata = {
  name: 'Oryn Finance',
  description: 'Oryn Finance',
  url: 'https://oryn.finance', 
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// 3. Set the networks
const networks = [ sepolia, baseSepolia, arbitrumSepolia ]

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks: networks as AppKitNetwork[],
  projectId,
  ssr: true
})

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
})

export function AppKitProvider({ children }: {children: React.ReactNode}) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}