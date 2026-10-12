import type { ImgHTMLAttributes } from "react";
import logoColor from "../../assets/esfita-logo-color.png";
import logoWhite from "../../assets/esfita-logo-white.png";
import { useThemeStore } from "../../store/themeStore";

export interface LogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  /**
   * "auto" picks the readable variant for the current theme (color on light, white on dark).
   * Use "white" explicitly when placing the logo on a permanently colored/dark surface
   * (e.g. the accent-colored header or the login page's brand panel).
   */
  variant?: "auto" | "color" | "white";
}

export function Logo({ variant = "auto", className, ...props }: Readonly<LogoProps>) {
  const resolvedMode = useThemeStore((s) => s.resolvedMode);
  const useWhite = variant === "white" || (variant === "auto" && resolvedMode === "dark");

  return <img src={useWhite ? logoWhite : logoColor} alt="Esfita" className={className} {...props} />;
}
