import { motion } from 'framer-motion'

// ── Badge ──────────────────────────────────────────────────────────────────
const variantMap = {
  active:'badge-green', pending:'badge-yellow', completed:'badge-violet',
  terminated:'badge-red', ongoing:'badge-violet', review:'badge-yellow',
  approved:'badge-green', rejected:'badge-red', submitted:'badge-yellow',
  in_progress:'badge-blue', open:'badge-yellow', resolved:'badge-green',
  closed:'badge-slate', low:'badge-green', medium:'badge-yellow', high:'badge-red',
  present:'badge-green', absent:'badge-red', late:'badge-yellow',
  half_day:'badge-yellow', leave:'badge-slate', in_review:'badge-blue',
}
export function Badge({ status, label }) {
  const cls = variantMap[status] || 'badge-slate'
  const text = (label || status || '').toString().replace(/_/g,' ')
  return <span className={cls}>{text}</span>
}

// ── StatCard ───────────────────────────────────────────────────────────────
const iconColors = {
  violet:'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  red:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  sky:   'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
  slate: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
  primary:'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
}
export function StatCard({ label, value, icon: Icon, color='violet', trend, subtitle, desc }) {
  return (
    <div className="stat-card">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-white truncate">{value ?? '—'}</p>
        {(subtitle || desc) && <p className="text-xs text-zinc-400 mt-1">{subtitle || desc}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-1.5 font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
          </p>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl flex-shrink-0 ml-4 ${iconColors[color] || iconColors.violet}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────
export function Empty({ title='No data found', description, icon: Icon, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 flex items-center justify-center mb-5">
          <Icon size={28} className="text-violet-400" />
        </div>
      )}
      <p className="font-bold text-zinc-700 dark:text-zinc-300 text-base">{title}</p>
      {description && <p className="text-sm text-zinc-400 mt-2 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────
export function Skeleton({ lines=3, className='' }) {
  const widths = ['w-full','w-3/4','w-1/2','w-5/6','w-2/3']
  return (
    <div className={`space-y-2.5 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-4 ${widths[i % widths.length]}`} />
      ))}
    </div>
  )
}

// ── PageHeader ─────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}

// ── CourseCard (Udemy style task/project card) ─────────────────────────────
export function CourseCard({ title, subtitle, badge, progress, footer, onClick, children }) {
  return (
    <motion.div whileHover={{ y:-2 }} transition={{ duration:.15 }}
      className="course-card p-5 cursor-pointer" onClick={onClick}>
      {badge && <div className="mb-3">{badge}</div>}
      <h3 className="font-semibold text-zinc-900 dark:text-white mb-1 line-clamp-2 leading-snug">{title}</h3>
      {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-zinc-400">Progress</span>
            <span className="font-semibold text-violet-600">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill bg-violet-500" style={{ width:`${progress}%` }} />
          </div>
        </div>
      )}
      {children}
      {footer && <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">{footer}</div>}
    </motion.div>
  )
}
