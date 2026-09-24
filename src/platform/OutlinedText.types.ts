export interface OutlinedTextProps {
  children: string;
  fontFamily: string;
  fontSize: number;
  lineHeight?: number;
  color: string;
  /** Stroke width in px: 2 on buttons, 2.5 on the banner's big PLUS ULTRA. Don't outline text under ~20px. */
  strokeWidth?: number;
  strokeColor?: string;
  uppercase?: boolean;
  letterSpacing?: number;
  accessible?: boolean;
}
