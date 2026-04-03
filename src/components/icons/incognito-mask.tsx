import { SVGProps, forwardRef } from "react";

/**
 * Incognito Mask Icon — a stylized masquerade/domino mask
 * representing privacy, anonymity, and incognito mode.
 */
export const IncognitoMaskIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Mask body — smooth domino shape */}
      <path
        d="M256 48C150 48 60 100 32 160C32 160 30 168 32 180L56 320C72 380 160 440 256 440C352 440 440 380 456 320L480 180C482 168 480 160 480 160C452 100 362 48 256 48Z"
        fill="currentColor"
      />
      {/* Left eye cutout */}
      <path
        d="M140 200C120 200 104 218 104 244C104 270 120 288 140 288C160 288 180 270 188 244C196 218 176 200 140 200Z"
        fill="var(--mask-bg, #0a0a0a)"
      />
      {/* Right eye cutout */}
      <path
        d="M372 200C352 200 336 200 324 244C316 270 336 288 356 288C376 288 392 270 408 244C412 218 392 200 372 200Z"
        fill="var(--mask-bg, #0a0a0a)"
      />
      {/* Bridge between eyes — subtle curve */}
      <path
        d="M200 232C220 220 292 220 312 232"
        stroke="var(--mask-bg, #0a0a0a)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
);

IncognitoMaskIcon.displayName = "IncognitoMaskIcon";
