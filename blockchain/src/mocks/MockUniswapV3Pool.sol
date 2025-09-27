// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockUniswapV3Pool {
    uint160 private sqrtPriceX96;
    int24 private tick;

    constructor(uint160 _sqrtPriceX96, int24 _tick) {
        sqrtPriceX96 = _sqrtPriceX96;
        tick = _tick;
    }

    function setSlot0(uint160 _sqrtPriceX96, int24 _tick) external {
        sqrtPriceX96 = _sqrtPriceX96;
        tick = _tick;
    }

    function slot0()
        external
        view
        returns (
            uint160,
            int24,
            uint16,
            uint16,
            uint16,
            uint8,
            bool
        )
    {
        return (sqrtPriceX96, tick, 0, 0, 0, 0, true);
    }
}
