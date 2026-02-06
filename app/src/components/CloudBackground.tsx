import { motion } from 'framer-motion';

export function CloudBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Base gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #e8f4fc 0%, #d4e8f5 50%, #c8e0f0 100%)'
        }}
      />
      
      {/* Cloud image overlay */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'url(/images/background/sky-clouds.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Floating clouds animation */}
      <motion.div
        className="absolute top-10 left-0 w-full h-32 opacity-30"
        animate={{
          x: ['-10%', '10%', '-10%']
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <div className="w-64 h-20 bg-white rounded-full blur-2xl" />
      </motion.div>
      
      <motion.div
        className="absolute top-32 right-0 w-full h-32 opacity-25"
        animate={{
          x: ['10%', '-10%', '10%']
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <div className="w-80 h-24 bg-white rounded-full blur-3xl ml-auto" />
      </motion.div>
      
      <motion.div
        className="absolute bottom-40 left-20 w-full h-32 opacity-20"
        animate={{
          x: ['-5%', '5%', '-5%']
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <div className="w-48 h-16 bg-white rounded-full blur-2xl" />
      </motion.div>
    </div>
  );
}
