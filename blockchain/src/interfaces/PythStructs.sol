// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PythStructs
 * @notice Contains data structures used by Pyth Network
 */
library PythStructs {
    /**
     * @notice Represents a price with associated metadata.
     * @dev All prices are represented as fixed-point numbers with a specific exponent.
     * For example, a price with `price = 123456789` and `expo = -8` represents the price `1.23456789`.
     */
    struct Price {
        // Price as a fixed-point number
        int64 price;
        // Confidence interval around the price  
        uint64 conf;
        // Exponent for the price (negative values indicate decimal places)
        int32 expo;
        // Unix timestamp when the price was published
        uint256 publishTime;
    }

    /**
     * @notice Represents exponentially-weighted moving average price data.
     */
    struct PriceFeed {
        // The price ID
        bytes32 id;
        // Latest available price
        Price price;
        // Latest available exponentially-weighted moving average price
        Price emaPrice;
    }
}