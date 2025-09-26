import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg";
type ButtonType = "button" | "submit" | "reset";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: ButtonType;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm font-medium",
  md: "px-4 py-2 text-base font-medium",
  lg: "px-6 py-3 text-lg font-semibold",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-[#5A2BC7] disabled:bg-gray-400 disabled:cursor-not-allowed",
  secondary:
    "bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed",
  outline:
    "border-2 border-[#6F37E1] text-[#6F37E1] hover:bg-primary hover:text-white disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed",
  ghost:
    "text-[#6F37E1] hover:bg-primary hover:bg-opacity-10 disabled:text-gray-400 disabled:cursor-not-allowed",
  link: "text-[#6F37E1] underline hover:text-[#5A2BC7] disabled:text-gray-400 disabled:cursor-not-allowed",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  fullWidth = false,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center cursor-pointer rounded-full transition-all duration-200 focus:outline-none";
  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];
  const widthClass = fullWidth ? "w-full" : "";

  const combinedClasses =
    `${baseClasses} ${sizeClass} ${variantClass} ${widthClass} ${className}`.trim();

  const iconElement = icon && (
    <span className={iconPosition === "left" ? "mr-2" : "ml-2"}>{icon}</span>
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {icon && iconPosition === "left" && iconElement}
      {children}
      {icon && iconPosition === "right" && iconElement}
    </button>
  );
};
