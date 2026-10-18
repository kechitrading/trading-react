import {
  ActivitySquare,
  BarChart3,
  BookOpen,
  FileText,
  FlaskConical,
  Gauge,
  Inbox,
  LineChart,
  Moon,
  ScrollText,
  Settings,
  Shuffle,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** BRD requirement IDs the screen implements. */
  brd: string
  /** True once the screen is wired to the backend; the rest are placeholders. */
  ready?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Overview', icon: Gauge, brd: 'FR-030, FR-034', ready: true },
  { to: '/proposals', label: 'Proposals', icon: Inbox, brd: 'FR-011, FR-023, FR-077', ready: true },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet, brd: 'FR-014, FR-078, FR-080' },
  { to: '/arbitrage', label: 'Arbitrage', icon: Shuffle, brd: 'FR-017 to FR-022' },
  { to: '/analysis', label: 'Analysis', icon: BarChart3, brd: 'FR-061 to FR-064' },
  { to: '/forecasts', label: 'Forecasts', icon: LineChart, brd: 'FR-066 to FR-068' },
  { to: '/institutional', label: 'Institutional', icon: ActivitySquare, brd: 'FR-057 to FR-060' },
  { to: '/astrology', label: 'Astrology', icon: Moon, brd: 'FR-055, FR-056, FR-070 to FR-076' },
  { to: '/strategies', label: 'Strategies', icon: FlaskConical, brd: 'FR-046 to FR-051' },
  { to: '/reports', label: 'Reports', icon: FileText, brd: 'FR-038 to FR-045' },
  { to: '/audit', label: 'Audit log', icon: ScrollText, brd: 'FR-054' },
  { to: '/journal', label: 'Performance', icon: BookOpen, brd: 'FR-042, FR-082, FR-083' },
  { to: '/settings', label: 'Settings', icon: Settings, brd: 'FR-022, FR-037, FR-053' },
]
