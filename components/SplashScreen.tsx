"use client";

import { motion } from "framer-motion";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="text-white text-4xl font-semibold tracking-wide">
          SE RENTA
        </h1>

        <p className="text-gray-500 text-sm mt-3">
          Mapa comunitario en tiempo real
        </p>

        <div className="mt-6 flex justify-center">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
        </div>
      </motion.div>
    </div>
  );
}
