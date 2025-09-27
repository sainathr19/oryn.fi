import React, { useRef } from 'react'
import { Button } from './Button'
import { useAccount } from 'wagmi'
import { appKit } from '../providers/WalletProvider'

interface WalletConnectButtonProps {
    className?: string
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'
    size?: 'sm' | 'md' | 'lg'
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
    className = '',
    variant = 'primary',
    size = 'md'
}) => {
    const { address, isConnected } = useAccount()
    const appkitButtonRef = useRef<HTMLDivElement>(null)

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const handleConnect = () => {

        try {
            appKit.open()
        } catch (error) {
            console.error('Failed to open AppKit modal:', error)
            const appkitButton = appkitButtonRef.current?.querySelector('appkit-button') as any
            if (appkitButton) {
                appkitButton.click()
            } else {
                const anyAppkitButton = document.querySelector('appkit-button') as any
                if (anyAppkitButton) {
                    anyAppkitButton.click()
                }
            }
        }
    }

    const getButtonText = () => {
        if (isConnected && address) return formatAddress(address)
        return 'Connect'
    }

    const getButtonVariant = () => {
        if (isConnected) return 'secondary' as const
        return variant
    }

    return (
        <>
            <div ref={appkitButtonRef} className="hidden">
                <appkit-button />
            </div>

            <Button
                onClick={handleConnect}
                variant={getButtonVariant()}
                size={size}
                className={className}
            >
                {getButtonText()}
            </Button>
        </>
    )
}
