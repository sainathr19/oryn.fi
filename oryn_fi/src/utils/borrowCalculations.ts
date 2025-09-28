import { MAX_LTV } from "../constants/constants";

/**
 * Calculate the maximum borrow power based on the fiat value of the NFT position minus existing debt
 * @param fiatValue - The current fiat value of the NFT position in USD
 * @param existingDebt - The current debt amount in USD
 * @returns Maximum borrow power (80% of fiat value - existing debt)
 */
export const calculateMaxBorrowPower = (
  fiatValue: number,
  existingDebt: number = 0
): number => {
  const maxBorrowFromCollateral = fiatValue * MAX_LTV;
  const availableBorrowPower = Math.max(
    0,
    maxBorrowFromCollateral - existingDebt
  );
  return availableBorrowPower;
};

/**
 * Calculate the dynamic liquidation threshold based on collateral value and total debt
 * @param collateralValue - The current collateral value in USD
 * @param totalDebt - The total debt (existing + new borrow amount) in USD
 * @returns The liquidation threshold value
 */
export const calculateLiquidationThreshold = (
  collateralValue: number,
  totalDebt: number
): number => {
  // Liquidation threshold is 80% of collateral value
  const maxDebtBeforeLiquidation = collateralValue * MAX_LTV;
  // Current available buffer before liquidation
  const availableBuffer = Math.max(0, maxDebtBeforeLiquidation - totalDebt);
  return availableBuffer;
};

/**
 * Calculate the health factor based on collateral value and total debt
 * @param collateralValue - The current collateral value in USD
 * @param existingDebt - The current existing debt in USD
 * @param newBorrowAmount - The new amount the user wants to borrow
 * @returns Health factor (higher is safer, 1 is liquidation threshold)
 */
export const calculateHealthFactor = (
  collateralValue: number,
  existingDebt: number,
  newBorrowAmount: number
): number => {
  const totalDebt = existingDebt + newBorrowAmount;
  if (totalDebt === 0) return Infinity; // No debt = infinite health

  const maxDebtBeforeLiquidation = collateralValue * MAX_LTV;
  if (totalDebt >= maxDebtBeforeLiquidation) return 1; // At liquidation threshold

  return maxDebtBeforeLiquidation / totalDebt;
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
 * @param collateralValue - The collateral value for additional validation
 * @returns Object with validation result and error message
 */
export const validateBorrowAmount = (
  enteredAmount: number,
  maxBorrowPower: number,
  collateralValue?: number
): {
  isValid: boolean;
  error?: string;
} => {
  if (enteredAmount <= 0) {
    return { isValid: false, error: "Amount must be greater than 0" };
  }

  if (enteredAmount > maxBorrowPower) {
    return {
      isValid: false,
      error: `Amount cannot exceed available borrow power of $${maxBorrowPower.toFixed(
        2
      )}`,
    };
  }

  // Additional validation: ensure we don't exceed the token value limit
  if (collateralValue && enteredAmount > collateralValue) {
    return {
      isValid: false,
      error: `Amount cannot exceed collateral value of $${collateralValue.toFixed(
        2
      )}`,
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
