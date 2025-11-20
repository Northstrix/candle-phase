'use client';
import { cn } from "@/lib/utils";
import type { HTMLMotionProps, Variants } from "framer-motion";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

export interface GlobeIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface GlobeIconProps extends HTMLMotionProps<"div"> {
  size?: number;
  duration?: number;
}

const GlobeIcon = forwardRef<GlobeIconHandle, GlobeIconProps>(
  (
    {
      onMouseEnter,
      onMouseLeave,
      className,
      size = 28,
      duration = 1.5,
      ...props
    },
    ref,
  ) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () =>
          reduced ? controls.start("normal") : controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback(
      (e?: React.MouseEvent<HTMLDivElement>) => {
        if (reduced) return;
        if (!isControlled.current) controls.start("animate");
        else onMouseEnter?.(e as any);
      },
      [controls, reduced, onMouseEnter],
    );

    const handleLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlled.current) {
          controls.start("normal");
        } else {
          onMouseLeave?.(e as any);
        }
      },
      [controls, onMouseLeave],
    );

    const mainVariants: Variants = {
        normal: { rotate: 0 },
        animate: { rotate: 360, transition: { duration: 2 * duration, repeat: Infinity, ease: 'linear' } },
      };
  
      const lineVariants: Variants = {
        normal: { pathLength: 1, opacity: 1, transition: { duration: 0.5 * duration } },
        animate: {
          pathLength: [1, 0.5, 1],
          opacity: [1, 0.5, 1],
          transition: { duration: 1.5 * duration, repeat: Infinity, ease: 'easeInOut' },
        },
      };

    return (
      <motion.div
        className={cn("inline-flex items-center justify-center", className)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        {...props}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={mainVariants}
          animate={controls}
          initial="normal"
        >
          <motion.circle cx="12" cy="12" r="10" variants={lineVariants} />
          <motion.path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" variants={lineVariants} />
          <motion.path d="M2 12h20" variants={lineVariants} />
        </motion.svg>
      </motion.div>
    );
  },
);
GlobeIcon.displayName = "GlobeIcon";
export { GlobeIcon };
