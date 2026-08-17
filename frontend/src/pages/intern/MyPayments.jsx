import { useEffect, useState } from 'react'
import { IndianRupee, CheckCircle, Clock, AlertCircle, CreditCard, ExternalLink, FileText, ShieldCheck } from 'lucide-react'
import api from '../../services/api'
import { Badge, Empty, Skeleton, PageHeader, StatCard } from '../../components/common/index'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { COMPANY_NAME } from '../../utils/constants'

const STATUS_CFG = {
  paid:      { cls:'badge-green',  icon: CheckCircle, color:'#10b981', label:'Paid'        },
  pending:   { cls:'badge-yellow', icon: Clock,       color:'#f59e0b', label:'Pending'     },
  overdue:   { cls:'badge-red',    icon: AlertCircle, color:'#ef4444', label:'Overdue'     },
  initiated: { cls:'badge-violet', icon: Clock,       color:'#7c3aed', label:'Processing'  },
  waived:    { cls:'badge-slate',  icon: CheckCircle, color:'#71717a', label:'Waived'      },
}

// Load Razorpay script dynamically
const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true)
  const script = document.createElement('script')
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  script.onload  = () => resolve(true)
  script.onerror = () => resolve(false)
  document.body.appendChild(script)
})

export default function MyPayments() {
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [paying,   setPaying]   = useState(null) // paymentId being processed

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const r = await api.get('/razorpay/my-payments')
      setPayments(r.data.data || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchPayments() }, [])

  const handlePay = async (payment) => {
    if (paying) return
    setPaying(payment._id)
    try {
      // 1. Load Razorpay checkout script
      const loaded = await loadRazorpay()
      if (!loaded) { toast.error('Failed to load Razorpay. Check your internet connection.'); return }

      // 2. Create order on backend
      const { data } = await api.post('/razorpay/create-order', { paymentId: payment._id })
      if (!data.success) { toast.error(data.message); return }
      const { orderId, amount, currency, keyId, internName, internEmail } = data.data

      // 3. Open Razorpay checkout
      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount,
          currency,
          order_id:    orderId,
          name:        COMPANY_NAME + ' LMS',
          description: payment.title,
          image:       '/logo.svg',
          prefill: {
            name:  internName,
            email: internEmail,
          },
          theme: { color: '#7c3aed' },
          modal: {
            ondismiss: () => { toast('Payment cancelled.', { icon: '⚠️' }); resolve('cancelled') }
          },
          handler: async (response) => {
            try {
              // 4. Verify on backend
              toast.loading('Verifying payment…', { id: 'verify' })
              const verifyRes = await api.post('/razorpay/verify', {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                paymentId:           payment._id,
              })
              toast.dismiss('verify')
              if (verifyRes.data.success) {
                toast.success('Payment successful! Receipt sent to your email.')
                fetchPayments()
                resolve('success')
              } else {
                toast.error('Payment verification failed. Contact support.')
                resolve('failed')
              }
            } catch (e) {
              toast.dismiss('verify')
              toast.error('Verification error: ' + (e?.response?.data?.message || e.message))
              resolve('error')
            }
          }
        })
        rzp.on('payment.failed', (resp) => {
          toast.error(`Payment failed: ${resp.error.description}`)
          resolve('failed')
        })
        rzp.open()
      })
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Payment initiation failed')
    } finally {
      setPaying(null)
    }
  }

  const totalDue  = payments.filter(p => ['pending','overdue'].includes(p.status)).reduce((s,p) => s+p.amount, 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s,p) => s+p.amount, 0)
  const pendingCount = payments.filter(p => p.status === 'pending').length
  const overdueCount = payments.filter(p => p.status === 'overdue').length

  return (
    <div className="space-y-6 max-w-screen-xl">
      <PageHeader title="My Payments" subtitle="Project fees and internship payments" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Amount Due',   value: `₹${totalDue.toLocaleString()}`,  icon: AlertCircle,  color: overdueCount ? 'red' : 'amber' },
          { label:'Amount Paid',  value: `₹${totalPaid.toLocaleString()}`, icon: CheckCircle,  color:'green'  },
          { label:'Pending',      value: pendingCount,                      icon: Clock,        color:'amber'  },
          { label:'Overdue',      value: overdueCount,                      icon: AlertCircle,  color:'red'    },
        ].map((s,i) => (
          <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}>
            <StatCard {...s}/>
          </motion.div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="card border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400 text-sm">You have {overdueCount} overdue payment{overdueCount>1?'s':''}!</p>
            <p className="text-xs text-red-500 mt-0.5">Please complete payment to avoid losing access to project resources.</p>
          </div>
        </div>
      )}

      {/* Payment cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array(3).fill(0).map((_,i) => <div key={i} className="card p-5 h-48"><Skeleton lines={5}/></div>)}
        </div>
      ) : payments.length === 0 ? (
        <Empty title="No payments assigned" description="Your admin will assign project fees when applicable." icon={IndianRupee}/>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {payments.map((payment, i) => {
            const scfg = STATUS_CFG[payment.status] || STATUS_CFG.pending
            const isPaid      = payment.status === 'paid'
            const isInitiated = payment.status === 'initiated'
            const isPayable   = ['pending', 'overdue'].includes(payment.status)
            const isProcessing= paying === payment._id

            return (
              <motion.div key={payment._id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.08}}
                className={`card overflow-hidden ${payment.status==='overdue' ? 'border-red-200 dark:border-red-900' : ''}`}>
                {/* Top color bar */}
                <div className={`h-1.5 w-full`} style={{background: scfg.color}}/>

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`${scfg.cls} capitalize`}>{scfg.label}</span>
                        {payment.project && <span className="badge-blue text-xs">{payment.project.title}</span>}
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-base">{payment.title}</h3>
                      {payment.description && <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{payment.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white">₹{payment.amount?.toLocaleString()}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{payment.currency || 'INR'}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2.5">
                      <p className="text-zinc-400 mb-0.5">Invoice</p>
                      <p className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{payment.invoiceNumber || '—'}</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2.5">
                      <p className="text-zinc-400 mb-0.5">{isPaid ? 'Paid On' : 'Due Date'}</p>
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {isPaid
                          ? payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '—'
                          : payment.dueDate  ? new Date(payment.dueDate).toLocaleDateString()  : 'No deadline'}
                      </p>
                    </div>
                    {isPaid && payment.transactionId && (
                      <div className="col-span-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-2.5">
                        <p className="text-zinc-400 mb-0.5">Transaction ID</p>
                        <p className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 break-all">{payment.transactionId}</p>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  {isPaid ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl">
                      <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0"/>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Payment verified & confirmed</p>
                    </div>
                  ) : isInitiated ? (
                    <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900 rounded-xl">
                      <div className="w-4 h-4 border-2 border-violet-400 border-t-violet-600 rounded-full animate-spin flex-shrink-0"/>
                      <p className="text-sm text-violet-700 dark:text-violet-400 font-medium">Payment in progress…</p>
                    </div>
                  ) : isPayable ? (
                    <button onClick={() => handlePay(payment)} disabled={!!paying}
                      className={`btn-primary w-full py-3 text-sm font-bold ${paying&&paying!==payment._id?'opacity-60 cursor-not-allowed':''}`}>
                      {isProcessing ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Processing…</>
                      ) : (
                        <><CreditCard size={16}/>Pay ₹{payment.amount?.toLocaleString()} via Razorpay</>
                      )}
                    </button>
                  ) : (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs text-zinc-400 text-center capitalize">
                      Payment {payment.status}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Razorpay trust footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 pt-2">
        <ShieldCheck size={13} className="text-emerald-500"/>
        <span>Payments are 256-bit SSL secured and processed by</span>
        <a href="https://razorpay.com" target="_blank" rel="noreferrer" className="text-violet-600 hover:underline font-medium flex items-center gap-1">
          Razorpay <ExternalLink size={10}/>
        </a>
      </div>
    </div>
  )
}
