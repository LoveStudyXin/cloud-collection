import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { CSSProperties } from 'react';

interface AnimatedTitleProps {
  text: string;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}

export function AnimatedTitle({ text, className = '', delay = 0, style }: AnimatedTitleProps) {
  const letters = text.split('');

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay
      }
    }
  };

  const child: Variants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.h1
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
      style={style}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          variants={child}
          className="inline-block"
          style={{ whiteSpace: letter === ' ' ? 'pre' : 'normal' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.h1>
  );
}

interface AnimatedWordsProps {
  words: string[];
  className?: string;
  delay?: number;
}

export function AnimatedWords({ words, className = '', delay = 0 }: AnimatedWordsProps) {
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: delay
      }
    }
  };

  const child: Variants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={child}
          className="inline-block mr-4"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
