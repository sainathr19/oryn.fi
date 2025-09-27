export const IOType = {
  collateral: "collateral",
  loan: "loan",
} as const;

export type IOType = (typeof IOType)[keyof typeof IOType];
