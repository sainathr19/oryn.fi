// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PythStructs.sol";

/**
 * @title IPyth
 * @notice Interface for interacting with Pyth Network price feeds
 */
interface IPyth {
    /// @notice Returns the price feed for the given price feed ID.
    /// @dev Reverts if the price has not been updated within the last getValidTimePeriod() seconds.
    /// @param id The price feed ID to fetch the price for.
    /// @return price The current price
    function getPrice(bytes32 id) external view returns (PythStructs.Price memory price);

    /// @notice Returns the price feed for the given price feed ID if it is no older than the given age.
    /// @dev The price feed returned by this method is not older than age seconds.
    /// @param id The price feed ID to fetch the price for.
    /// @param age Maximum age of the price in seconds.
    /// @return price The current price if it's not older than age seconds
    function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (PythStructs.Price memory price);

    /// @notice Returns the price feed for the given price feed ID.
    /// @dev This method does not revert if the price has not been updated within the last getValidTimePeriod().
    /// @param id The price feed ID to fetch the price for.  
    /// @return price The current price
    function getPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory price);

    /// @notice Returns the EMA price feed for the given price feed ID.
    /// @param id The price feed ID to fetch the EMA price for.
    /// @return price The current EMA price
    function getEmaPrice(bytes32 id) external view returns (PythStructs.Price memory price);

    /// @notice Returns the EMA price feed for the given price feed ID if it is no older than the given age.
    /// @param id The price feed ID to fetch the EMA price for.
    /// @param age Maximum age of the price in seconds.
    /// @return price The current EMA price if it's not older than age seconds
    function getEmaPriceNoOlderThan(bytes32 id, uint256 age) external view returns (PythStructs.Price memory price);

    /// @notice Returns the EMA price feed for the given price feed ID.
    /// @dev This method does not revert if the price has not been updated within the last getValidTimePeriod().
    /// @param id The price feed ID to fetch the EMA price for.
    /// @return price The current EMA price
    function getEmaPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory price);

    /// @notice Update the on-chain price feeds using the provided update data.
    /// @param updateData Array of encoded price update data.
    function updatePriceFeeds(bytes[] calldata updateData) external payable;

    /// @notice Update the on-chain price feeds if the provided update data is newer than the current data.
    /// @param updateData Array of encoded price update data.
    /// @param priceIds Array of price feed IDs corresponding to the update data.
    /// @param publishTimes Array of publish times for each price update.
    function updatePriceFeedsIfNecessary(
        bytes[] calldata updateData,
        bytes32[] calldata priceIds,
        uint64[] calldata publishTimes
    ) external payable;

    /// @notice Returns the required fee to update the given price feeds.
    /// @param updateData Array of encoded price update data.
    /// @return feeAmount The required fee amount in wei.
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint256 feeAmount);

    /// @notice Returns the valid time period for a price feed.
    /// @return validTimePeriod The valid time period in seconds.
    function getValidTimePeriod() external view returns (uint256 validTimePeriod);
}