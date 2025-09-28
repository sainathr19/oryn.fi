// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Mock interfaces for Uniswap V4 since we don't have the actual imports
interface IPoolManager {
    function initialize(PoolKey memory key, uint160 sqrtPriceX96, bytes calldata hookData) external returns (int24 tick);
    function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint16 lpFee);
}

interface IPositionManager {
    function initializePool(PoolKey memory key, uint160 sqrtPriceX96, bytes calldata hookData) external payable returns (int24 tick);
    function modifyLiquidities(bytes calldata unlockData, uint256 deadline) external payable;
    function multicall(bytes[] calldata data) external payable returns (bytes[] memory results);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

// Structs for Uniswap V4
struct PoolKey {
    address currency0;
    address currency1;
    uint24 fee;
    int24 tickSpacing;
    address hooks;
}

struct Currency {
    address token;
}

contract V4UniswapLPScript is Script {
    
    /////////////////////////////////////
    // --- TESTNET CONTRACT ADDRESSES ---
    /////////////////////////////////////
    
    // These should be updated with actual testnet deployment addresses
    address public constant POOL_MANAGER = 	0xE03A1074c86CFeDd5C142C4F04F1a1536e203543; // UPDATE THIS
    address public constant POSITION_MANAGER = 0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4; // UPDATE THIS
    address public constant FACTORY_ADDRESS = 0x4e59b44847b379578588920cA78FbF26c0B4956C; // Common CREATE2 factory
    
    // Test tokens - update these with your testnet token addresses WBTC/ USD
    address public constant TOKEN0 = 0xeBf11B64DC588FcC2573c9a6Efda449888ef2B27; // Use address(0) for native ETH
    address public constant TOKEN1 = 0x38A72C43Abd3fCDC56764E0D0226d9d6D17c3192; // UPDATE THIS
    
    // Hook contract - deploy separately if needed
    address public constant HOOK_CONTRACT = 0x2AacF8Be54414704E610FB0551e1bC18B8078400; // Set to address(0) if no hooks
    
    /////////////////////////////////////
    // --- CONFIGURABLE PARAMETERS ---
    /////////////////////////////////////
    
    uint24 public lpFee = 3000; // 0.30%
    int24 public tickSpacing = 60;
    uint160 public startingPrice = 79228162514264337593543950336; // sqrt(1) * 2^96, price = 1:1
    
    // Liquidity amounts
    uint256 public token0Amount = 1000e18; // 1 token
    uint256 public token1Amount = 1e18; // 1 token
    
    // Position range (will be calculated dynamically)
    int24 public tickLower;
    int24 public tickUpper;
    
    // Contract instances
    IPoolManager public poolManager;
    IPositionManager public positionManager;
    
    /////////////////////////////////////
    // --- DEPLOYMENT FUNCTIONS ---
    /////////////////////////////////////
    
    function run() external {
        vm.startBroadcast();
        
        // Initialize contract instances
        poolManager = IPoolManager(POOL_MANAGER);
        positionManager = IPositionManager(POSITION_MANAGER);
        
        console.log("=== Uniswap V4 LP Script ===");
        console.log("Pool Manager:", POOL_MANAGER);
        console.log("Position Manager:", POSITION_MANAGER);
        console.log("Token0:", TOKEN0);
        console.log("Token1:", TOKEN1);
        
        // Step 1: Deploy hook if needed (optional)
        if (HOOK_CONTRACT == address(0)) {
            console.log("No hook contract specified, using address(0)");
        }
        
        // Step 2: Create pool key
        PoolKey memory poolKey = PoolKey({
            currency0: TOKEN0,
            currency1: TOKEN1,
            fee: lpFee,
            tickSpacing: tickSpacing,
            hooks: HOOK_CONTRACT
        });
        
        // Step 3: Calculate tick range based on current or starting price
        _calculateTickRange(poolKey);
        
        // Step 4: Try to initialize pool (will revert if already initialized)
        _initializePool(poolKey);
        
        // Step 5: Add liquidity
        _addLiquidity(poolKey);
        
        vm.stopBroadcast();
        
        console.log("=== Script Completed ===");
    }
    
    function _calculateTickRange(PoolKey memory poolKey) internal {
        console.log("Calculating tick range...");
        
        uint160 currentPrice;
        
        try poolManager.getSlot0(_getPoolId(poolKey)) returns (uint160 sqrtPriceX96, int24 /* tick */, uint16 /* protocolFee */, uint16 /* lpFee */) {
            // Pool exists, use current price
            currentPrice = sqrtPriceX96;
            console.log("Pool exists, using current price");
        } catch {
            // Pool doesn't exist, use starting price
            currentPrice = startingPrice;
            console.log("Pool doesn't exist, using starting price");
        }
        
        int24 currentTick = _getTickAtSqrtPrice(currentPrice);
        
        // Set tick range: current tick +/- 1000 tick spacings
        tickLower = _truncateTickSpacing(currentTick - 1000 * tickSpacing, tickSpacing);
        tickUpper = _truncateTickSpacing(currentTick + 1000 * tickSpacing, tickSpacing);
        
        console.log("Current tick:", vm.toString(currentTick));
        console.log("Tick lower:", vm.toString(tickLower));
        console.log("Tick upper:", vm.toString(tickUpper));
    }
    
    function _initializePool(PoolKey memory poolKey) internal {
        console.log("Attempting to initialize pool...");
        
        bytes memory hookData = new bytes(0);
        
        try positionManager.initializePool(poolKey, startingPrice, hookData) {
            console.log("Pool initialized successfully");
        } catch {
            console.log("Pool already initialized or initialization failed");
        }
    }
    
    function _addLiquidity(PoolKey memory /* poolKey */) internal {
        console.log("Adding liquidity...");
        
        // Approve tokens if not native ETH
        _approveTokens();
        
        // Calculate liquidity amount (simplified calculation)
        uint128 liquidity = _calculateLiquidity();
        
        // Prepare multicall parameters
        bytes[] memory params = new bytes[](1);
        
        // For now, we'll use a simplified approach since we don't have full V4 libraries
        // In a real implementation, you'd use the proper encoding
        bytes memory actions = abi.encode("mint", tickLower, tickUpper, liquidity);
        bytes[] memory mintParams = new bytes[](1);
        mintParams[0] = abi.encode(token0Amount, token1Amount, msg.sender);
        
        params[0] = abi.encodeWithSelector(
            positionManager.modifyLiquidities.selector,
            abi.encode(actions, mintParams),
            block.timestamp + 3600
        );
        
        // Calculate value to send (if TOKEN0 is native ETH)
        uint256 valueToPass = (TOKEN0 == address(0)) ? token0Amount + 1 : 0;
        
        try positionManager.multicall{value: valueToPass}(params) {
            console.log("Liquidity added successfully");
            console.log("Token0 amount:", token0Amount);
            console.log("Token1 amount:", token1Amount);
        } catch Error(string memory reason) {
            console.log("Failed to add liquidity:", reason);
        } catch {
            console.log("Failed to add liquidity: unknown error");
        }
    }
    
    function _approveTokens() internal {
        console.log("Approving tokens...");
        
        // Approve TOKEN1 (TOKEN0 is native ETH if address(0))
        if (TOKEN1 != address(0)) {
            IERC20(TOKEN1).approve(POSITION_MANAGER, type(uint256).max);
            console.log("TOKEN1 approved");
        }
        
        // If TOKEN0 is not native ETH, approve it too
        if (TOKEN0 != address(0)) {
            IERC20(TOKEN0).approve(POSITION_MANAGER, type(uint256).max);
            console.log("TOKEN0 approved");
        }
    }
    
    /////////////////////////////////////
    // --- UTILITY FUNCTIONS ---
    /////////////////////////////////////
    
    function _calculateLiquidity() internal view returns (uint128) {
        // Simplified liquidity calculation
        // In real V4, you'd use LiquidityAmounts.getLiquidityForAmounts
        return uint128((token0Amount + token1Amount) / 2);
    }
    
    function _getPoolId(PoolKey memory poolKey) internal pure returns (bytes32) {
        // Simplified pool ID calculation
        return keccak256(abi.encode(poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks));
    }
    
    function _getTickAtSqrtPrice(uint160 sqrtPriceX96) internal pure returns (int24 tick) {
        // Simplified tick calculation - in real implementation use TickMath library
        // This is a rough approximation
        if (sqrtPriceX96 <= 79228162514264337593543950336) {
            return 0; // Price around 1.0
        } else if (sqrtPriceX96 <= 111922464470321808166068170000000000000) {
            return 1000; // Higher price
        } else {
            return -1000; // Lower price
        }
    }
    
    function _truncateTickSpacing(int24 tick, int24 spacing) internal pure returns (int24) {
        return (tick / spacing) * spacing;
    }
    
    /////////////////////////////////////
    // --- CONFIGURATION FUNCTIONS ---
    /////////////////////////////////////
    
    function setLiquidityAmounts(uint256 _token0Amount, uint256 _token1Amount) external {
        token0Amount = _token0Amount;
        token1Amount = _token1Amount;
        console.log("Updated liquidity amounts - Token0:", _token0Amount, "Token1:", _token1Amount);
    }
    
    function setFeeAndSpacing(uint24 _fee, int24 _spacing) external {
        lpFee = _fee;
        tickSpacing = _spacing;
        console.log("Updated fee:", _fee, "spacing:", vm.toString(_spacing));
    }
    
    function setStartingPrice(uint160 _price) external {
        startingPrice = _price;
        console.log("Updated starting price:", _price);
    }
    
    /////////////////////////////////////
    // --- VIEW FUNCTIONS ---
    /////////////////////////////////////
    
    function getPoolKey() external view returns (PoolKey memory) {
        return PoolKey({
            currency0: TOKEN0,
            currency1: TOKEN1,
            fee: lpFee,
            tickSpacing: tickSpacing,
            hooks: HOOK_CONTRACT
        });
    }
    
    function getConfiguration() external view returns (
        uint24 fee,
        int24 spacing,
        uint160 price,
        uint256 amount0,
        uint256 amount1
    ) {
        return (lpFee, tickSpacing, startingPrice, token0Amount, token1Amount);
    }
    
    /////////////////////////////////////
    // --- TEST FUNCTIONS ---
    /////////////////////////////////////
    
    function testTokenBalances() external view {
        console.log("=== Token Balances ===");
        
        if (TOKEN0 != address(0)) {
            uint256 balance0 = IERC20(TOKEN0).balanceOf(msg.sender);
            console.log("TOKEN0 balance:", balance0);
        } else {
            console.log("TOKEN0 balance (ETH):", msg.sender.balance);
        }
        
        if (TOKEN1 != address(0)) {
            uint256 balance1 = IERC20(TOKEN1).balanceOf(msg.sender);
            console.log("TOKEN1 balance:", balance1);
        }
    }
    
    // Fallback to receive ETH
    receive() external payable {}
}

// Deployment helper contract for hooks (if needed)
contract HookDeployer {
    address public immutable FACTORY;
    
    constructor(address _factory) {
        FACTORY = _factory;
    }
    
    function deployHook(
        bytes memory creationCode,
        bytes memory constructorArgs,
        uint160 flags
    ) external returns (address hookAddress, bytes32 salt) {
        // Simplified hook deployment
        // In real V4, you'd use HookMiner.find() to mine the correct salt
        salt = keccak256(abi.encode(block.timestamp, msg.sender, flags));
        
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        
        assembly {
            hookAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        
        require(hookAddress != address(0), "Hook deployment failed");
    }
}
