import { Check, X } from "lucide-react";
import React from "react";

interface Props {
  className?: string;
  arrowClassName?: string;
  size?: number;
  issuccess?: boolean;
}

/**
 * AnimatedCheck component
 * Animates the container and the check icon with bounce and stroke-draw effect
 */
const AnimatedCheck: React.FC<Props> = ({
  className,
  size = 52,
  arrowClassName,
  issuccess = true,
}) => {
  return (
    <>
      <style>
        {`
          /* Container bounce scale animation */
          @keyframes bounceScale {
            0%, 20%, 50%, 80%, 100% {
              transform: scale(1);
            }
            40% {
              transform: scale(1.15);
            }
            60% {
              transform: scale(0.95);
            }
          }

          /* Stroke draw animation for SVG path */
          @keyframes strokeDraw {
            0% {
              stroke-dashoffset: 100;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }

          .check-container {
            animation: bounceScale 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }

          /* Apply stroke-dasharray only if svg path is accessible */
          .check-icon path {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            animation: strokeDraw 0.6s forwards ease-out;
            animation-delay: 0.3s;
          }
        `}
      </style>

      <div
        className={`mx-auto w-[84px] h-[84px] rounded-full bg-teal-500 flex flex-col items-center justify-center check-container ${className} `}
      >
        {/* 
          The check icon from react-feather supports className, which applies to svg
          The path inside svg can be styled with .check-icon path selector above.
        */}
        {issuccess ? (
          <Check
            strokeWidth={3}
            size={size}
            color="#FFF"
            className={`mt-1.5 check-icon ${arrowClassName}`}
            aria-label="Animated checkmark"
            role="img"
          />
        ) : (
          <X
            strokeWidth={3}
            size={size}
            color="#FFF"
            className={`mt-1.5 check-icon ${arrowClassName}`}
            aria-label="Animated checkmark"
            role="img"
          />
        )}
      </div>
    </>
  );
};

export default AnimatedCheck;
