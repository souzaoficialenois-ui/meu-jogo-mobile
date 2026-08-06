/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

export default function App() {
  return (
    <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 selection:bg-neutral-200">
      <div className="max-w-xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <h1 className="text-6xl md:text-8xl font-light tracking-tight text-neutral-900">
            Hello, <span className="font-serif italic text-neutral-400">World</span>
          </h1>
          
          <div className="flex items-center justify-center space-x-4">
            <div className="h-px w-12 bg-neutral-200" />
            <p className="text-neutral-500 font-medium uppercase tracking-[0.2em] text-xs">
              Welcome to the build
            </p>
            <div className="h-px w-12 bg-neutral-200" />
          </div>
        </motion.div>
      </div>
    </main>
  );
}
