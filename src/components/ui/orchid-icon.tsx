"use client";

import React from 'react';
import { motion } from 'framer-motion';

export const OrchidIcon = ({ className = "w-14 h-14", ...props }: React.SVGProps<SVGSVGElement>) => (
  <motion.svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    <defs>
      <linearGradient id="orchidPetalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="50%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#9333EA" />
      </linearGradient>
      
      <linearGradient id="orchidDeepGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#6B21A8" />
      </linearGradient>

      <radialGradient id="orchidCenterYellow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="70%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#B45309" />
      </radialGradient>

      <filter id="orchidGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Stem */}
    <motion.path
      d="M50 75 Q50 95 48 98"
      stroke="#059669"
      strokeWidth="3"
      strokeLinecap="round"
      variants={{
        initial: { pathLength: 0 },
        animate: { pathLength: 1, transition: { duration: 0.8 } }
      }}
    />

    {/* Back Sepals */}
    <g filter="url(#orchidGlow)">
      {/* Top Sepal */}
      <motion.path
        d="M50 50 C50 50 35 15 50 5 C65 15 50 50 50 50Z"
        fill="url(#orchidPetalGradient)"
        variants={{
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1, transition: { delay: 0.1, duration: 0.5 } }
        }}
      />
      
      {/* Bottom Left Sepal */}
      <motion.path
        d="M45 55 C45 55 15 75 18 55 C22 35 45 55 45 55Z"
        fill="url(#orchidDeepGradient)"
        variants={{
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1, transition: { delay: 0.2, duration: 0.5 } }
        }}
      />
      
      {/* Bottom Right Sepal */}
      <motion.path
        d="M55 55 C55 55 85 75 82 55 C78 35 55 55 55 55Z"
        fill="url(#orchidDeepGradient)"
        variants={{
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1, transition: { delay: 0.2, duration: 0.5 } }
        }}
      />
    </g>

    {/* Large Side Petals */}
    <g filter="url(#orchidGlow)">
      {/* Left Petal */}
      <motion.path
        d="M48 50 C48 50 15 45 20 25 C25 5 48 50 48 50Z"
        fill="url(#orchidPetalGradient)"
        variants={{
          initial: { scale: 0, opacity: 0, rotate: -10 },
          animate: { scale: 1, opacity: 1, rotate: 0, transition: { delay: 0.3, duration: 0.6 } }
        }}
      />
      
      {/* Right Petal */}
      <motion.path
        d="M52 50 C52 50 85 45 80 25 C75 5 52 50 52 50Z"
        fill="url(#orchidPetalGradient)"
        variants={{
          initial: { scale: 0, opacity: 0, rotate: 10 },
          animate: { scale: 1, opacity: 1, rotate: 0, transition: { delay: 0.3, duration: 0.6 } }
        }}
      />
    </g>

    {/* Vein Details */}
    <motion.g 
      stroke="#4C1D95" 
      strokeWidth="0.5" 
      opacity="0.3"
      variants={{
        initial: { opacity: 0 },
        animate: { opacity: 0.3, transition: { delay: 0.8 } }
      }}
    >
      <path d="M50 10 L50 45" />
      <path d="M25 35 L48 48" />
      <path d="M75 35 L52 48" />
      <path d="M25 60 L45 55" />
      <path d="M75 60 L55 55" />
    </motion.g>

    {/* Labellum (Lip) - The center yellow part */}
    <motion.g
      variants={{
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition: { delay: 0.5, type: "spring", stiffness: 200 } }
      }}
    >
      <path
        d="M50 45 Q40 45 40 60 Q40 75 50 85 Q60 75 60 60 Q60 45 50 45Z"
        fill="url(#orchidCenterYellow)"
        filter="url(#orchidGlow)"
      />
      <circle cx="50" cy="58" r="4" fill="#78350F" opacity="0.6" />
      <path d="M46 62 Q50 68 54 62" stroke="#78350F" strokeWidth="1" fill="none" />
    </motion.g>

    {/* Hover animations */}
    <motion.circle
      cx="50"
      cy="55"
      r="2"
      fill="white"
      variants={{
        initial: { opacity: 0 },
        hover: { opacity: 0.8, scale: 1.5, transition: { repeat: Infinity, duration: 1, repeatType: "reverse" } }
      }}
    />
  </motion.svg>
);
