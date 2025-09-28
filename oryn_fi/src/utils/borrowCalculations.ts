import { MAX_LTV } from '../constants/constants';

/**
 * Calculate the maximum borrow power based on the fiat value of the NFT position
 * @param fiatValue - The current fiat value of the NFT position in USD
 * @returns Maximum borrow power (80% of fiat value)
 */
export const calculateMaxBorrowPower = (fiatValue: number): number => {
  return fiatValue * MAX_LTV;
};

/**
 * Calculate the liquidation threshold based on the entered borrow amount
 * @param enteredAmount - The amount the user wants to borrow
 * @param maxBorrowPower - The maximum amount that can be borrowed
 * @returns The liquidation threshold value
 */
export const calculateLiquidationThreshold = (enteredAmount: number, maxBorrowPower: number): number => {
  if (enteredAmount === 0) return 0;
  return maxBorrowPower - enteredAmount;
};

/**
 * Calculate the health factor based on the entered amount and max borrow power
 * @param enteredAmount - The amount the user wants to borrow
 * @param maxBorrowPower - The maximum amount that can be borrowed
 * @returns Health factor (higher is safer, 1 is liquidation threshold)
 */
export const calculateHealthFactor = (enteredAmount: number, maxBorrowPower: number): number => {
  if (enteredAmount === 0) return Infinity; // No debt = infinite health
  if (enteredAmount >= maxBorrowPower) return 1; // At liquidation threshold
  return maxBorrowPower / enteredAmount;
};

/**
 * Get the color for the health factor indicator
 * @param healthFactor - The calculated health factor
 * @returns Color string for the health factor
 */
export const getHealthFactorColor = (healthFactor: number): string => {
  if (healthFactor >= 2) return "green";
  if (healthFactor >= 1.5) return "green";
  if (healthFactor >= 1.2) return "orange";
  return "red";
};

/**
 * Validate if the entered amount is within acceptable range
 * @param enteredAmount - The amount the user wants to borrow
 * @param maxBorrowPower - The maximum amount that can be borrowed
 * @returns Object with validation result and error message
 */
export const validateBorrowAmount = (enteredAmount: number, maxBorrowPower: number): {
  isValid: boolean;
  error?: string;
} => {
  if (enteredAmount <= 0) {
    return { isValid: false, error: "Amount must be greater than 0" };
  }
  
  if (enteredAmount > maxBorrowPower) {
    return { 
      isValid: false, 
      error: `Amount cannot exceed maximum borrow power of $${maxBorrowPower.toFixed(2)}` 
    };
  }
  
  return { isValid: true };
};

/**
 * Convert bigint USD value to number for calculations
 * @param value - Bigint value from contract
 * @returns Number value in USD
 */
export const convertBigIntToUSD = (value: bigint): number => {
  // Assuming the contract returns values in wei-like format (18 decimals)
  // Adjust this based on your contract's decimal handling
  return Number(value) / Math.pow(10, 18);
};
