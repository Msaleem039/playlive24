// "use client"

// import { useState } from "react"
// import { X } from "lucide-react"
// import { motion, AnimatePresence } from "framer-motion"
// import { Input } from "@/components/input"

// interface DepositWithdrawModalProps {
//   isOpen: boolean
//   onClose: () => void
//   type: "deposit" | "withdraw"
//   username: string
//   onSubmit: (data: { amount: string; remarks: string }) => void
// }

// export default function DepositWithdrawModal({
//   isOpen,
//   onClose,
//   type,
//   username,
//   onSubmit,
// }: DepositWithdrawModalProps) {
//   const [amount, setAmount] = useState("")
//   const [remarks, setRemarks] = useState("")
//   const [isLoading, setIsLoading] = useState(false)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!amount.trim()) {
//       return
//     }
    
//     setIsLoading(true)
//     try {
//       await onSubmit({ amount, remarks })
//       // Reset form
//       setAmount("")
//       setRemarks("")
//       onClose()
//     } catch (error) {
//       console.error("Error submitting transaction:", error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleClose = () => {
//     setAmount("")
//     setRemarks("")
//     onClose()
//   }

//   const title = type === "deposit" ? "Deposit Cash" : "Withdraw Cash"
//   const fullTitle = `${title} - ${username}`

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 z-50 flex items-center justify-center p-4"
//         >
//           {/* Overlay */}
//           <div
//             className="absolute inset-0 bg-black/50 backdrop-blur-sm"
//             onClick={handleClose}
//           />

//           {/* Modal */}
//           <motion.div
//             initial={{ scale: 0.9, opacity: 0, y: 20 }}
//             animate={{ scale: 1, opacity: 1, y: 0 }}
//             exit={{ scale: 0.9, opacity: 0, y: 20 }}
//             transition={{ type: "spring", duration: 0.3 }}
//             className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
//           >
//             {/* Header - Green Background */}
//             <div className="bg-[#2ECC71] px-6 py-4 flex items-center justify-between">
//               <h2 className="text-black font-bold text-lg">{fullTitle}</h2>
//               <button
//                 onClick={handleClose}
//                 className="text-black hover:text-gray-200 transition-colors p-1 rounded hover:bg-white/20"
//                 aria-label="Close"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             {/* Content Area - White Background */}
//             <form onSubmit={handleSubmit} className="bg-white">
//               {/* Amount Field */}
//               <div className="px-6 py-4 border-b border-dashed border-gray-300">
//                 <div className="flex items-center gap-4">
//                   <label className="text-sm text-black  font-bold text-gray-900 whitespace-nowrap min-w-[80px]">
//                     Amount
//                   </label>
//                   <Input
//                     type="number"
//                     value={amount}
//                     onChange={(e) => setAmount(e.target.value)}
//                     placeholder="Amount"
//                     className="flex-1 border-gray-300 rounded-md"
//                     required
//                     min="0"
//                     step="0.01"
//                   />
//                 </div>
//               </div>

//               {/* Remarks Field */}
//               <div className="px-6 py-4 border-b border-dashed border-gray-300">
//                 <div className="flex items-center gap-4">
//                   <label className="text-sm font-bold text-gray-900 whitespace-nowrap min-w-[80px]">
//                     Remarks
//                   </label>
//                   <Input
//                     type="text"
//                     value={remarks}
//                     onChange={(e) => setRemarks(e.target.value)}
//                     placeholder="Remarks"
//                     className="flex-1 border-gray-300 rounded-md"
//                   />
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="px-6 py-4 flex justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={handleClose}
//                   className="px-6 py-2 bg-[#E74C3C] hover:bg-[#C0392B] text-black font-semibold rounded-md transition-colors"
//                   disabled={isLoading}
//                 >
//                   No
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-6  py-2 bg-[#2ECC71] hover:bg-[#27AE60] text-black font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                   disabled={isLoading || !amount.trim()}
//                 >
//                   {isLoading ? "Processing..." : "Submit"}
//                 </button>
//               </div>
//             </form>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   )
// }

