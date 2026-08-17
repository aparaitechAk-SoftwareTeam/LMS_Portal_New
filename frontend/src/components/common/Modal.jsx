import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, size='md', subtitle }) {
  const sizes = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' }

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            initial={{ opacity:0, scale:.95, y:10 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:.95, y:10 }}
            transition={{ duration:.2, ease:'easeOut' }}
            className={`card w-full ${sizes[size]} max-h-[92vh] overflow-y-auto shadow-2xl`}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="font-bold text-zinc-900 dark:text-white text-lg leading-tight">{title}</h2>
                {subtitle && <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors ml-4 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
