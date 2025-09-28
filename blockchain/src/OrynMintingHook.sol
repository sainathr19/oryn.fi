// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseHook} from "lib/v4-template/lib/uniswap-hooks/src/base/BaseHook.sol";
import {Hooks} from "lib/v4-template/lib/uniswap-hooks/lib/v4-core/src/libraries/Hooks.sol";
import {IPoolManager, ModifyLiquidityParams} from "lib/v4-template/lib/uniswap-hooks/lib/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "lib/v4-template/lib/uniswap-hooks/lib/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "lib/v4-template/lib/uniswap-hooks/lib/v4-core/src/types/BalanceDelta.sol";
import {IPositionManager} from "lib/v4-template/lib/uniswap-hooks/lib/v4-periphery/src/interfaces/IPositionManager.sol";

import "./OrynEngine.sol";

/**
 * @title OrynMintingHook
 * @dev Simple Uniswap v4 hook that calls existing OrynEngine to mint oUSD
 * Users specify mint amount via hook data
 */
contract OrynMintingHook is BaseHook {
    // Hook data structure for minting parameters
    struct MintingParams {
        bool shouldMint;        // Whether to mint oUSD
        uint256 mintAmount;     // Amount of oUSD to mint (in wei)
    }

    // Events
    event LiquidityAddedWithMint(
        address indexed user,
        uint256 indexed tokenId,
        uint256 mintAmount,
        uint256 positionId
    );

    // State variables
    OrynEngine public immutable orynEngine;
    IPositionManager public immutable positionManager;

    constructor(IPoolManager _poolManager, address _orynEngine, address _positionManager) BaseHook(_poolManager) {
        orynEngine = OrynEngine(_orynEngine);
        positionManager = IPositionManager(_positionManager);
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: true,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    /**
     * @dev Hook called after liquidity is added
     * @param sender The user adding liquidity
     * @param key Pool key containing token addresses and fee
     * @param params Liquidity modification parameters
     * @param delta0 Token0 balance delta
     * @param delta1 Token1 balance delta
     * @param hookData Encoded MintingParams
     */
    function _afterAddLiquidity(
        address sender,
        PoolKey calldata key,
        ModifyLiquidityParams calldata params,
        BalanceDelta delta0,
        BalanceDelta delta1,
        bytes calldata hookData
    ) internal override returns (bytes4, BalanceDelta) {
        // Only process if hook data is provided
        // if (hookData.length == 0) {
        //     return (this.afterAddLiquidity.selector, BalanceDelta.wrap(0));
        // }

        // Decode minting parameters
        MintingParams memory mintParams = abi.decode(hookData, (MintingParams));
        
        // Process minting if requested
        // if (mintParams.shouldMint) {
            _processMinting(sender, key, params, mintParams);
        // }

        return (this.afterAddLiquidity.selector, BalanceDelta.wrap(0));
    }

    /**
     * @dev Process the minting logic by calling existing OrynEngine
     */
    function _processMinting(
        address sender,
        PoolKey calldata key,
        ModifyLiquidityParams calldata params,
        MintingParams memory mintParams
    ) internal {
        // Get the v4 NFT token ID from the position
        uint256 tokenId = _getV4PositionTokenId(sender, key, params);
        
        // Call existing OrynEngine function to deposit NFT and mint oUSD
        // Use depositUniPositionAndMintFrom to transfer from the user's address
        uint256 positionId = orynEngine.depositUniPositionAndMintFrom(sender, tokenId, 0);

        emit LiquidityAddedWithMint(sender, tokenId, mintParams.mintAmount, positionId);
    }

    /**
     * @dev Get the v4 NFT token ID from the position
     * Gets the next token ID that will be minted by the position manager
     */
    function _getV4PositionTokenId(
        address sender,
        PoolKey calldata key,
        ModifyLiquidityParams calldata params
    ) internal view returns (uint256) {
        // Get the next token ID that will be minted
        // This is the token ID for the position being created
        return positionManager.nextTokenId();
    }
}
