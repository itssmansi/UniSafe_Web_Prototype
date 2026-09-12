import { useState } from 'react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import {
  CheckCircle2Icon,
  CircleIcon,
  CircleDashedIcon,
  CircleCheckBigIcon,
  FileDownIcon,
  MessageCircleIcon,
  PencilIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  TimerIcon,
  UserRoundIcon,
  XIcon,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import type { TooltipProps } from 'recharts'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpRightIcon,
  CalendarDotsIcon,
  CaretDownIcon,
  ClockIcon,
  FileArrowUpIcon,
} from './icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  currentUser,
  dashboardAppointmentStatusFilters,
  dashboardDepartmentLoad,
  dashboardMetrics,
  dashboardAppointments,
  dashboardStaffPerformance,
  dashboardTimelineData,
  dashboardTimelineRanges,
  filterDashboardAppointments,
  staffDetails,
  dashboardResources,
} from './data'
import type {
  DashboardAppointment,
  DashboardAppointmentStatus,
  DashboardAppointmentStatusFilter,
  DashboardTimelineRange,
} from './data'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'

const dashboardColors = {
  scheduled: 'var(--dashboard-scheduled)',
  completed: 'var(--dashboard-completed)',
  noShow: 'var(--dashboard-no-show)',
  secondary: 'var(--dashboard-secondary)',
  destructive: 'var(--destructive)',
} as const

const chartSeries = [
  { key: 'scheduled', label: 'Dispatched / In Field', color: dashboardColors.scheduled },
  { key: 'completed', label: 'Resolved & Verified', color: dashboardColors.completed },
  { key: 'noShow', label: 'Escalated / Pending', color: dashboardColors.noShow },
] as const

const statusClassName: Record<DashboardAppointmentStatus, string> = {
  'In progress':
    'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-medium',
  Waiting:
    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium',
  Confirmed:
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium',
  Done:
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium',
}

const filterStatusIcons: Record<
  DashboardAppointmentStatusFilter,
  ComponentType<{ className?: string }>
> = {
  all: SlidersHorizontalIcon,
  'In progress': TimerIcon,
  Waiting: CircleDashedIcon,
  Confirmed: CheckCircle2Icon,
  Done: CircleCheckBigIcon,
}

function DashboardCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'min-w-0 rounded-xl bg-card p-4 text-card-foreground border border-border/50 shadow-xs transition-shadow hover:shadow-sm',
        className
      )}
    >
      {children}
    </section>
  )
}

function CardHeader({
  title,
  action,
  className,
}: {
  title: ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-2', className)}>
      <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
      {action ? (
        <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground">
          {action}
        </div>
      ) : null}
    </div>
  )
}

function MetricBars({
  lastSixDays,
  className,
}: {
  lastSixDays: readonly number[]
  className: string
}) {
  const maximum = Math.max(...lastSixDays, 1)

  return (
    <div className="flex h-7.5 w-10 shrink-0 items-end justify-between gap-0.5">
      {lastSixDays.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={cn('w-1.5 rounded-t-sm transition-all', className)}
          style={{ height: `${(value / maximum) * 100}%` }}
        />
      ))}
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number | string | Array<number | string>, string | number>) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs text-popover-foreground shadow-md backdrop-blur-md">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <div className="flex flex-col gap-1.5">
        {payload.map((item, index) => (
          <div
            key={`${String(item.dataKey)}-${index}`}
            className="flex items-center justify-between gap-6"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 rounded-sm shrink-0"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComplaintVolumeCard({
  range,
  onRangeChange,
}: {
  range: DashboardTimelineRange
  onRangeChange: (range: DashboardTimelineRange) => void
}) {
  const volumeData = dashboardTimelineData[range] || dashboardTimelineData['7D']
  const currentRangeMeta = dashboardTimelineRanges.find((r) => r.value === range)

  return (
    <DashboardCard className="flex flex-col gap-4">
      <CardHeader
        title="Civic Complaint Trends & Resolution Volume"
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5 rounded-lg">
                <CalendarDotsIcon className="size-3.5" />
                <span>{currentRangeMeta?.label}</span>
                <CaretDownIcon className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuRadioGroup
                value={range}
                onValueChange={(val) => onRangeChange(val as DashboardTimelineRange)}
              >
                {dashboardTimelineRanges.map((r) => (
                  <DropdownMenuRadioItem key={r.value} value={r.value}>
                    {r.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="grid flex-1 gap-6 md:grid-cols-[8.5rem_minmax(0,1fr)]">
        <div className="grid grid-cols-3 gap-3 md:flex md:flex-col md:justify-center md:gap-5 border-r md:border-r border-border/40 pr-2">
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-sky-500">48</span>
            <span className="text-xs text-muted-foreground leading-tight">Dispatched Today</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-emerald-500">62</span>
            <span className="text-xs text-muted-foreground leading-tight">Resolved & Verified</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-amber-500">3</span>
            <span className="text-xs text-muted-foreground leading-tight">Escalated / Pending</span>
          </div>
        </div>

        <div className="min-h-0 min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-end gap-4">
            {chartSeries.map((series) => (
              <div
                key={series.key}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <span
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
              </div>
            ))}
          </div>

          <div className="h-64 min-w-md md:min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={150}>
              <BarChart
                data={volumeData}
                barGap={4}
                barCategoryGap="22%"
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
                  content={(props) => <ChartTooltip {...props} />}
                />
                <Bar
                  dataKey="scheduled"
                  name="Dispatched"
                  fill={dashboardColors.scheduled}
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="completed"
                  name="Resolved"
                  fill={dashboardColors.completed}
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="noShow"
                  name="Escalated"
                  fill={dashboardColors.noShow}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}

function DepartmentLoadCard() {
  const totalCases = dashboardDepartmentLoad.reduce((acc, d) => acc + d.total, 0)

  return (
    <DashboardCard className="flex flex-col gap-4">
      <CardHeader
        title="Civic Department Capacity"
        action={
          <span className="text-xs font-semibold text-primary">
            {totalCases} Active Tasks
          </span>
        }
      />

      <div className="flex flex-col gap-4">
        {/* Multi-segment load bar */}
        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-secondary gap-1 p-0.5 border border-border/50">
          {dashboardDepartmentLoad.map((dept) => {
            const width = (dept.total / totalCases) * 100
            return (
              <span
                key={dept.code}
                className="h-full rounded-full transition-all"
                style={{
                  width: `${width}%`,
                  backgroundColor: dept.color,
                }}
                title={`${dept.name}: ${dept.total} tasks (${dept.percentage}% load)`}
              />
            )
          })}
        </div>

        {/* Detailed department breakdown list */}
        <div className="flex flex-col gap-3 mt-1">
          {dashboardDepartmentLoad.map((dept) => (
            <div
              key={dept.code}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="size-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: dept.color }}
                />
                <span className="font-medium text-foreground truncate">{dept.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded border border-border/40">
                  {dept.code}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-muted-foreground font-medium">
                  {dept.completed}/{dept.total}
                </span>
                <span className="font-semibold text-foreground w-8 text-right">
                  {dept.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  )
}

function ComplaintsTableCard({
  complaints,
  statusFilter,
  onStatusFilterChange,
  onSelectComplaint,
}: {
  complaints: readonly DashboardAppointment[]
  statusFilter: DashboardAppointmentStatusFilter
  onStatusFilterChange: (status: DashboardAppointmentStatusFilter) => void
  onSelectComplaint?: (complaint: DashboardAppointment) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = filterDashboardAppointments(complaints, statusFilter, search)

  return (
    <DashboardCard className="flex flex-col gap-3 px-0 pb-0 overflow-hidden">
      <div className="px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Live Civic Issues & Dispatch Log
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time citizen complaints across wards
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter issues or citizen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 px-2.5 text-xs bg-secondary/80 border border-border/60 rounded-lg outline-none focus:border-primary w-44"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-lg">
                <SlidersHorizontalIcon className="size-3.5" />
                <span>{statusFilter === 'all' ? 'All Status' : statusFilter}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Status Filter</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(val) => onStatusFilterChange(val as DashboardAppointmentStatusFilter)}
              >
                {dashboardAppointmentStatusFilters.map((st) => (
                  <DropdownMenuRadioItem key={st} value={st}>
                    {st === 'all' ? 'All Statuses' : st}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar border-t border-border/40 mt-1">
        <table className="w-full min-w-160 table-fixed text-left text-xs">
          <thead>
            <tr className="h-9 text-muted-foreground font-medium bg-muted/30 border-b border-border/40">
              <th className="w-[12%] px-4">Ticket ID</th>
              <th className="w-[28%] px-4">Issue & Ward</th>
              <th className="w-[20%] px-4">Citizen Reporter</th>
              <th className="w-[22%] px-4">Assigned Department</th>
              <th className="w-[18%] px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelectComplaint && onSelectComplaint(item)}
                className="h-14 border-b border-border/30 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <td className="px-4 font-mono font-medium text-foreground">
                  {item.id}
                </td>
                <td className="px-4">
                  <div className="flex flex-col truncate">
                    <span className="font-semibold text-foreground truncate">
                      {item.notes || 'Civic Grievance'}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {item.room}
                    </span>
                  </div>
                </td>
                <td className="px-4">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm" className="h-6 w-6">
                      <AvatarImage src={item.patient.avatar} />
                      <AvatarFallback>{item.patient.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground truncate">
                      {item.patient.name}
                    </span>
                  </div>
                </td>
                <td className="px-4">
                  <span className="text-foreground/90 font-medium truncate block">
                    {item.doctor.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {item.doctor.department}
                  </span>
                </td>
                <td className="px-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] leading-4',
                      statusClassName[item.status]
                    )}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No civic complaints found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  )
}

function StaffPerformanceCard({
  onSelectStaff,
}: {
  onSelectStaff: (staffName: string) => void
}) {
  return (
    <DashboardCard className="flex flex-col gap-3 px-0 pb-0">
      <div className="px-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground tracking-tight">
          Field Officers & Ward Leads
        </h2>
        <span className="text-xs text-muted-foreground">Active Units</span>
      </div>

      <div className="flex flex-col border-t border-border/40">
        {dashboardStaffPerformance.map((officer, index) => (
          <button
            key={officer.id}
            type="button"
            onClick={() => onSelectStaff(officer.name)}
            className={cn(
              'flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 cursor-pointer',
              index > 0 && 'border-t border-border/30'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-10 rounded-xl">
                <AvatarImage src={officer.avatar} alt={officer.name} className="rounded-xl" />
                <AvatarFallback>{officer.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {officer.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {officer.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-right">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">
                  {officer.solved}
                </span>
                <span className="text-[10px] text-muted-foreground">Solved</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-emerald-500">
                  {officer.onTimeRate}
                </span>
                <span className="text-[10px] text-muted-foreground">On-Time</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </DashboardCard>
  )
}

function ResourcesCard() {
  return (
    <DashboardCard className="flex flex-col gap-3">
      <CardHeader
        title="Rapid Action Field Units"
        action={
          <span className="text-xs text-emerald-500 font-medium">
            4 Deployed
          </span>
        }
      />

      <div className="flex flex-col gap-3">
        {dashboardResources.map((res, index) => (
          <div
            key={res.id}
            className={cn(
              'flex items-center justify-between gap-3 text-xs',
              index > 0 && 'border-t border-border/30 pt-2.5'
            )}
          >
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground truncate">{res.name}</span>
              <span className="text-[11px] text-muted-foreground truncate">
                {res.operator} • {res.eta}
              </span>
            </div>
            <span
              className={cn(
                'px-2 py-0.5 rounded-md font-medium shrink-0 text-[10px]',
                res.statusColor
              )}
            >
              {res.status}
            </span>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

function OfficerDetailsSheet({
  officerName,
  open,
  onOpenChange,
}: {
  officerName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const details = officerName ? staffDetails[officerName] : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-6">
        <SheetTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Field Officer Dossier
        </SheetTitle>
        <SheetDescription className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Jurisdiction assignment and operational performance record
        </SheetDescription>

        {details && (
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 rounded-2xl border-2 border-primary/20">
                <AvatarImage src={details.avatar} alt={details.name} className="rounded-2xl" />
                <AvatarFallback>{details.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {details.name}
                </h3>
                <p className="text-xs text-primary font-semibold">{details.role}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{details.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{details.solvedCount}</p>
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Cases Solved</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{details.onTimeRate}</p>
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">SLA Adherence</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{details.rating} ★</p>
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Citizen Rating</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Operational Bio
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                {details.bio}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Resolved Tasks
              </h4>
              <div className="flex flex-col gap-2">
                {details.recentCases.map((cs) => (
                  <div
                    key={cs.title}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{cs.title}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{cs.ward} • {cs.date}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {cs.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                className="flex-1 gap-2 text-xs h-10"
                onClick={() => alert(`Direct dispatch order sent to ${details.name}`)}
              >
                <ShieldCheck className="size-4" />
                Dispatch Task
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2 text-xs h-10"
                onClick={() => alert(`Dialing official line: ${details.phone}`)}
              >
                <MessageCircleIcon className="size-4" />
                Call Line
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function DashboardPage({
  authority,
  onSelectComplaint,
}: {
  authority?: any
  onSelectComplaint?: (complaint: any) => void
}) {
  const [selectedRange, setSelectedRange] = useState<DashboardTimelineRange>('7D')
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<DashboardAppointmentStatusFilter>('all')
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null)

  const officerName = authority?.name || currentUser.name
  const officerDept = authority?.department || currentUser.department

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header Banner */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Unified Command
            </span>
            <span className="text-xs text-muted-foreground">
              {officerDept}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome, {officerName}
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarDotsIcon className="size-3.5" />
            <span>Friday, Sep 04, 2026 • Real-time Civic Incident Telemetry</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs rounded-lg"
            onClick={() => alert('Exporting Official Civic Incident Report PDF...')}
          >
            <FileArrowUpIcon className="size-3.5" />
            <span>Export Incident Log</span>
          </Button>

          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5 text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            onClick={() => alert('Opening Emergency Unit Dispatch Console...')}
          >
            <PlusIcon className="size-3.5" />
            <span>Dispatch Unit</span>
          </Button>
        </div>
      </section>

      {/* 4 Metric KPI Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <article
            key={metric.title}
            className="flex h-32 min-w-0 flex-col justify-between rounded-xl bg-card p-4 text-card-foreground border border-border/50 shadow-xs hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {metric.title}
              </h3>
              <ClockIcon className="size-4 text-primary shrink-0" />
            </div>

            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">
                  {metric.value}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  <span
                    className={cn(
                      'font-semibold',
                      metric.changeType === 'increase' ? 'text-emerald-500' : 'text-sky-500'
                    )}
                  >
                    {metric.change}
                  </span>
                  <span className="text-muted-foreground text-[11px]">{metric.period}</span>
                </div>
              </div>

              <MetricBars
                lastSixDays={metric.lastSixDays}
                className="bg-primary/70"
              />
            </div>
          </article>
        ))}
      </section>

      {/* Main Charts Row */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ComplaintVolumeCard
          range={selectedRange}
          onRangeChange={setSelectedRange}
        />
        <DepartmentLoadCard />
      </section>

      {/* Tables & Side Cards Row */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ComplaintsTableCard
          complaints={dashboardAppointments}
          statusFilter={complaintStatusFilter}
          onStatusFilterChange={setComplaintStatusFilter}
          onSelectComplaint={onSelectComplaint}
        />

        <div className="flex flex-col gap-5">
          <StaffPerformanceCard onSelectStaff={setSelectedOfficer} />
          <ResourcesCard />
        </div>
      </section>

      {/* Officer Details Slide-over Sheet */}
      <OfficerDetailsSheet
        officerName={selectedOfficer}
        open={selectedOfficer !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedOfficer(null)
        }}
      />
    </div>
  )
}
