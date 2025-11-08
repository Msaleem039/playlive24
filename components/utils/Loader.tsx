"use client"

import { motion } from "framer-motion"

export default function Loader() {
  return (
    <>
      <style>{`
        .loader-spinner {
          width: 50px;
          padding: 8px;
          aspect-ratio: 1;
          border-radius: 50%;
          background: #00A66E;
          --_m: 
            conic-gradient(#0000 10%, #000),
            linear-gradient(#000 0 0) content-box;
          -webkit-mask: var(--_m);
          mask: var(--_m);
          -webkit-mask-composite: source-out;
          mask-composite: subtract;
          animation: loader-rotate 1s infinite linear;
        }
        @keyframes loader-rotate {
          to { transform: rotate(1turn); }
        }
      `}</style>
      
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          {/* Main Spinner with CSS animation */}
          <div className="relative mb-6 flex justify-center">
            <div className="loader-spinner" />
          </div>

          {/* Loading text with animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
            <div className="flex items-center justify-center gap-1">
              <motion.span
                className="w-2 h-2 bg-[#00A66E] rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              />
              <motion.span
                className="w-2 h-2 bg-[#00A66E] rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              />
              <motion.span
                className="w-2 h-2 bg-[#00A66E] rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
