// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IPyth.sol";
import "../interfaces/PythStructs.sol";

/**
 * @title MockPyth
 * @notice Mock implementation of Pyth Network for testing purposes
 * @dev This contract allows setting mock price data for testing
 */
contract MockPyth is IPyth {
    
    error PriceFeedNotFound();
    error StalePrice();
    
    // Mapping from price feed ID to price data
    mapping(bytes32 => PythStructs.Price) private prices;
    mapping(bytes32 => PythStructs.Price) private emaPrices;
    
    // Valid time period for price feeds (default 60 seconds)
    uint256 private validTimePeriod = 300; // 5 minutes
    
    /**
     * @notice Set mock price data for a given price feed ID
     * @param id The price feed ID
     * @param price The price value (as fixed-point with exponent)
     * @param conf The confidence interval
     * @param expo The exponent (negative for decimal places)
     * @param publishTime The publish timestamp (0 uses current block timestamp)
     */
    function setPrice(
        bytes32 id,
        int64 price,
        uint64 conf,
        int32 expo,
        uint256 publishTime
    ) external {
        prices[id] = PythStructs.Price({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: publishTime == 0 ? block.timestamp : publishTime
        });
    }
    
    /**
     * @notice Set mock EMA price data for a given price feed ID
     * @param id The price feed ID
     * @param price The EMA price value
     * @param conf The confidence interval
     * @param expo The exponent
     * @param publishTime The publish timestamp (0 uses current block timestamp)
     */
    function setEmaPrice(
        bytes32 id,
        int64 price,
        uint64 conf,
        int32 expo,
        uint256 publishTime
    ) external {
        emaPrices[id] = PythStructs.Price({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: publishTime == 0 ? block.timestamp : publishTime
        });
    }
    
    /**
     * @notice Set the valid time period for price feeds
     * @param _validTimePeriod The valid time period in seconds
     */
    function setValidTimePeriod(uint256 _validTimePeriod) external {
        validTimePeriod = _validTimePeriod;
    }
    
    /// @inheritdoc IPyth
    function getPrice(bytes32 id) external view returns (PythStructs.Price memory price) {
        price = prices[id];
        if (price.publishTime == 0) {
            revert PriceFeedNotFound();
        }
        
        if (block.timestamp - price.publishTime > validTimePeriod) {
            revert StalePrice();
        }
        
        return price;
    }
    
    /// @inheritdoc IPyth
    function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (PythStructs.Price memory price) {
        price = prices[id];
        if (price.publishTime == 0) {
            revert PriceFeedNotFound();
        }
        
        if (block.timestamp - price.publishTime > age) {
            revert StalePrice();
        }
        
        return price;
    }
    
    /// @inheritdoc IPyth
    function getPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory price) {
        price = prices[id];
        if (price.publishTime == 0) {
            revert PriceFeedNotFound();
        }
        return price;
    }
    
    /// @inheritdoc IPyth
    function getEmaPrice(bytes32 id) external view returns (PythStructs.Price memory price) {
        price = emaPrices[id];
        if (price.publishTime == 0) {
            revert PriceFeedNotFound();
        }
        
        if (block.timestamp - price.publishTime > validTimePeriod) {
            revert StalePrice();
        }
        
        return price;
    }
    
    /// @inheritdoc IPyth
    function getEmaPriceNoOlderThan(bytes32 id, uint256 age) external view returns (PythStructs.Price memory price) {
        price = emaPrices[id];
        if (price.publishTime == 0) {
            revert PriceFeedNotFound();
        }
        
        if (block.timestamp - price.publishTime > age) {
            revert StalePrice();
        }
        
        return price;
    }
    
    /// @inheritdoc IPyth
    function getEmaPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory price) {
        price = emaPrices[id];
        if (price.publishTime == 0) {
            revert PriceFeedNotFound();
        }
        return price;
    }
    
    /// @inheritdoc IPyth
    function updatePriceFeeds(bytes[] calldata) external payable {
        // Mock implementation - does nothing
        // In a real implementation, this would parse and update price data
    }
    
    /// @inheritdoc IPyth
    function updatePriceFeedsIfNecessary(
        bytes[] calldata,
        bytes32[] calldata,
        uint64[] calldata
    ) external payable {
        // Mock implementation - does nothing
    }
    
    /// @inheritdoc IPyth
    function getUpdateFee(bytes[] calldata) external pure returns (uint256 feeAmount) {
        // Mock implementation - return 0 fee
        return 0;
    }
    
    /// @inheritdoc IPyth
    function getValidTimePeriod() external view returns (uint256) {
        return validTimePeriod;
    }
    
    /**
     * @notice Helper function to get current price data for a feed (for testing)
     * @param id The price feed ID
     * @return The current price data
     */
    function getCurrentPrice(bytes32 id) external view returns (PythStructs.Price memory) {
        return prices[id];
    }
    
    /**
     * @notice Helper function to get current EMA price data for a feed (for testing)
     * @param id The price feed ID  
     * @return The current EMA price data
     */
    function getCurrentEmaPrice(bytes32 id) external view returns (PythStructs.Price memory) {
        return emaPrices[id];
    }
}