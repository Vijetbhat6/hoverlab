'use client'

/**
 * Icon browser.
 *
 * A searchable grid over the icon set the whole catalog already uses, so
 * anything you find here matches the blocks you paste beside it.
 *
 * Deliberately a curated subset rather than all ~1,600 Lucide icons.
 * Rendering the full set means importing the full set — roughly a megabyte
 * of JavaScript for a page whose job is to help you find one icon — and a
 * grid of 1,600 tiles is a worse way to find something than a search box
 * over the 180 that cover almost every real UI need. The link out to
 * lucide.dev is there for the long tail.
 *
 * Search matches keywords, not just names: someone looking for "delete"
 * should find `Trash2`, and looking for "user" should find `CircleUser`.
 */

import * as React from 'react'
import {
  AlertCircle, AlertTriangle, Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
  Award, BarChart3, Bell, BellOff, Bold, Book, Bookmark, Box, Briefcase, Calendar,
  Camera, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  CircleUser, Clipboard, Clock, Cloud, Code, Code2, Cog, Command, Copy, CreditCard,
  Database, Download, Edit, ExternalLink, Eye, EyeOff, File, FileText, Filter, Flag,
  Folder, Gift, Github, Globe, Grid3x3, Heart, HelpCircle, Home, Image, Inbox, Info,
  Key, Layers, Layout, Link as LinkIcon, List, Loader2, Lock, LogIn, LogOut, Mail,
  Map, MapPin, Maximize2, Menu, MessageCircle, MessageSquare, Mic, Minus, Monitor,
  Moon, MoreHorizontal, MoreVertical, Move, Music, Navigation, Package, Paperclip,
  Pause, Pencil, Phone, PieChart, Play, Plus, Power, Printer, RefreshCw, Repeat,
  Reply, Rocket, RotateCcw, Rss, Save, Scale, Search, Send, Server, Settings, Share2,
  Shield, ShieldCheck, ShoppingBag, ShoppingCart, Sidebar, SlidersHorizontal,
  Smartphone, Sparkles, Star, Sun, Table, Tag, Target, Terminal, ThumbsDown, ThumbsUp,
  Timer, Trash2, TrendingDown, TrendingUp, Truck, Twitter, Upload, User, UserPlus,
  Users, Video, Wallet, Wifi, X, XCircle, Zap, ZoomIn,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { cn } from '@/lib/utils'

interface Entry {
  name: string
  Icon: LucideIcon
  /** Extra search terms — what someone types when they don't know the name. */
  keywords?: string
}

const ICONS: Entry[] = [
  { name: 'AlertCircle', Icon: AlertCircle, keywords: 'error warning problem' },
  { name: 'AlertTriangle', Icon: AlertTriangle, keywords: 'warning danger caution' },
  { name: 'Archive', Icon: Archive, keywords: 'box store' },
  { name: 'ArrowDown', Icon: ArrowDown }, { name: 'ArrowLeft', Icon: ArrowLeft },
  { name: 'ArrowRight', Icon: ArrowRight, keywords: 'next forward continue' },
  { name: 'ArrowUp', Icon: ArrowUp }, { name: 'Award', Icon: Award, keywords: 'prize badge' },
  { name: 'BarChart3', Icon: BarChart3, keywords: 'analytics stats graph' },
  { name: 'Bell', Icon: Bell, keywords: 'notification alert' },
  { name: 'BellOff', Icon: BellOff, keywords: 'mute silence' },
  { name: 'Bold', Icon: Bold, keywords: 'text format' },
  { name: 'Book', Icon: Book, keywords: 'docs read' },
  { name: 'Bookmark', Icon: Bookmark, keywords: 'save favorite' },
  { name: 'Box', Icon: Box, keywords: 'package cube' },
  { name: 'Briefcase', Icon: Briefcase, keywords: 'work job business' },
  { name: 'Calendar', Icon: Calendar, keywords: 'date schedule' },
  { name: 'Camera', Icon: Camera, keywords: 'photo' },
  { name: 'Check', Icon: Check, keywords: 'tick done yes' },
  { name: 'CheckCircle2', Icon: CheckCircle2, keywords: 'success complete' },
  { name: 'ChevronDown', Icon: ChevronDown, keywords: 'expand dropdown' },
  { name: 'ChevronLeft', Icon: ChevronLeft }, { name: 'ChevronRight', Icon: ChevronRight },
  { name: 'ChevronUp', Icon: ChevronUp, keywords: 'collapse' },
  { name: 'CircleUser', Icon: CircleUser, keywords: 'avatar profile account' },
  { name: 'Clipboard', Icon: Clipboard, keywords: 'paste copy' },
  { name: 'Clock', Icon: Clock, keywords: 'time recent' },
  { name: 'Cloud', Icon: Cloud, keywords: 'server hosting' },
  { name: 'Code', Icon: Code, keywords: 'developer' },
  { name: 'Code2', Icon: Code2, keywords: 'developer snippet' },
  { name: 'Cog', Icon: Cog, keywords: 'settings gear config' },
  { name: 'Command', Icon: Command, keywords: 'cmd shortcut palette' },
  { name: 'Copy', Icon: Copy, keywords: 'duplicate clipboard' },
  { name: 'CreditCard', Icon: CreditCard, keywords: 'payment billing pay' },
  { name: 'Database', Icon: Database, keywords: 'storage sql' },
  { name: 'Download', Icon: Download, keywords: 'save export' },
  { name: 'Edit', Icon: Edit, keywords: 'pencil write modify' },
  { name: 'ExternalLink', Icon: ExternalLink, keywords: 'open new tab' },
  { name: 'Eye', Icon: Eye, keywords: 'view show visible preview' },
  { name: 'EyeOff', Icon: EyeOff, keywords: 'hide invisible password' },
  { name: 'File', Icon: File }, { name: 'FileText', Icon: FileText, keywords: 'document' },
  { name: 'Filter', Icon: Filter, keywords: 'refine sort' },
  { name: 'Flag', Icon: Flag, keywords: 'report' },
  { name: 'Folder', Icon: Folder, keywords: 'directory' },
  { name: 'Gift', Icon: Gift, keywords: 'present reward' },
  { name: 'Github', Icon: Github, keywords: 'git repo source' },
  { name: 'Globe', Icon: Globe, keywords: 'world language international' },
  { name: 'Grid3x3', Icon: Grid3x3, keywords: 'layout gallery' },
  { name: 'Heart', Icon: Heart, keywords: 'like favorite love' },
  { name: 'HelpCircle', Icon: HelpCircle, keywords: 'question support faq' },
  { name: 'Home', Icon: Home, keywords: 'house dashboard' },
  { name: 'Image', Icon: Image, keywords: 'photo picture' },
  { name: 'Inbox', Icon: Inbox, keywords: 'mail messages' },
  { name: 'Info', Icon: Info, keywords: 'about detail' },
  { name: 'Key', Icon: Key, keywords: 'password api secret' },
  { name: 'Layers', Icon: Layers, keywords: 'stack levels' },
  { name: 'Layout', Icon: Layout, keywords: 'template grid' },
  { name: 'LinkIcon', Icon: LinkIcon, keywords: 'url chain anchor' },
  { name: 'List', Icon: List, keywords: 'items menu' },
  { name: 'Loader2', Icon: Loader2, keywords: 'spinner loading pending' },
  { name: 'Lock', Icon: Lock, keywords: 'secure private password' },
  { name: 'LogIn', Icon: LogIn, keywords: 'sign in enter' },
  { name: 'LogOut', Icon: LogOut, keywords: 'sign out exit' },
  { name: 'Mail', Icon: Mail, keywords: 'email envelope' },
  { name: 'Map', Icon: Map }, { name: 'MapPin', Icon: MapPin, keywords: 'location address' },
  { name: 'Maximize2', Icon: Maximize2, keywords: 'expand fullscreen' },
  { name: 'Menu', Icon: Menu, keywords: 'hamburger nav' },
  { name: 'MessageCircle', Icon: MessageCircle, keywords: 'chat comment' },
  { name: 'MessageSquare', Icon: MessageSquare, keywords: 'chat feedback' },
  { name: 'Mic', Icon: Mic, keywords: 'audio record voice' },
  { name: 'Minus', Icon: Minus, keywords: 'remove subtract' },
  { name: 'Monitor', Icon: Monitor, keywords: 'desktop screen' },
  { name: 'Moon', Icon: Moon, keywords: 'dark theme night' },
  { name: 'MoreHorizontal', Icon: MoreHorizontal, keywords: 'ellipsis menu options' },
  { name: 'MoreVertical', Icon: MoreVertical, keywords: 'kebab options' },
  { name: 'Move', Icon: Move, keywords: 'drag reorder' },
  { name: 'Music', Icon: Music, keywords: 'audio song' },
  { name: 'Navigation', Icon: Navigation, keywords: 'direction compass' },
  { name: 'Package', Icon: Package, keywords: 'box shipping bundle' },
  { name: 'Paperclip', Icon: Paperclip, keywords: 'attach file' },
  { name: 'Pause', Icon: Pause }, { name: 'Pencil', Icon: Pencil, keywords: 'edit write' },
  { name: 'Phone', Icon: Phone, keywords: 'call contact' },
  { name: 'PieChart', Icon: PieChart, keywords: 'analytics stats' },
  { name: 'Play', Icon: Play, keywords: 'start video' },
  { name: 'Plus', Icon: Plus, keywords: 'add new create' },
  { name: 'Power', Icon: Power, keywords: 'on off' },
  { name: 'Printer', Icon: Printer, keywords: 'print' },
  { name: 'RefreshCw', Icon: RefreshCw, keywords: 'reload sync retry' },
  { name: 'Repeat', Icon: Repeat, keywords: 'loop recurring' },
  { name: 'Reply', Icon: Reply, keywords: 'respond' },
  { name: 'Rocket', Icon: Rocket, keywords: 'launch ship deploy' },
  { name: 'RotateCcw', Icon: RotateCcw, keywords: 'undo reset revert' },
  { name: 'Rss', Icon: Rss, keywords: 'feed blog' },
  { name: 'Save', Icon: Save, keywords: 'disk store' },
  { name: 'Scale', Icon: Scale, keywords: 'compare balance legal' },
  { name: 'Search', Icon: Search, keywords: 'find magnify lookup' },
  { name: 'Send', Icon: Send, keywords: 'submit message' },
  { name: 'Server', Icon: Server, keywords: 'backend hosting' },
  { name: 'Settings', Icon: Settings, keywords: 'gear preferences config' },
  { name: 'Share2', Icon: Share2, keywords: 'social send' },
  { name: 'Shield', Icon: Shield, keywords: 'security safe' },
  { name: 'ShieldCheck', Icon: ShieldCheck, keywords: 'verified secure trust' },
  { name: 'ShoppingBag', Icon: ShoppingBag, keywords: 'store commerce' },
  { name: 'ShoppingCart', Icon: ShoppingCart, keywords: 'cart basket checkout' },
  { name: 'Sidebar', Icon: Sidebar, keywords: 'panel layout' },
  { name: 'SlidersHorizontal', Icon: SlidersHorizontal, keywords: 'filter adjust controls' },
  { name: 'Smartphone', Icon: Smartphone, keywords: 'mobile phone device' },
  { name: 'Sparkles', Icon: Sparkles, keywords: 'ai magic new' },
  { name: 'Star', Icon: Star, keywords: 'favorite rating' },
  { name: 'Sun', Icon: Sun, keywords: 'light theme day' },
  { name: 'Table', Icon: Table, keywords: 'grid data rows' },
  { name: 'Tag', Icon: Tag, keywords: 'label category price' },
  { name: 'Target', Icon: Target, keywords: 'goal aim' },
  { name: 'Terminal', Icon: Terminal, keywords: 'cli console shell' },
  { name: 'ThumbsDown', Icon: ThumbsDown, keywords: 'dislike' },
  { name: 'ThumbsUp', Icon: ThumbsUp, keywords: 'like approve' },
  { name: 'Timer', Icon: Timer, keywords: 'countdown stopwatch' },
  { name: 'Trash2', Icon: Trash2, keywords: 'delete remove bin' },
  { name: 'TrendingDown', Icon: TrendingDown, keywords: 'decrease loss' },
  { name: 'TrendingUp', Icon: TrendingUp, keywords: 'increase growth' },
  { name: 'Truck', Icon: Truck, keywords: 'shipping delivery' },
  { name: 'Twitter', Icon: Twitter, keywords: 'social x' },
  { name: 'Upload', Icon: Upload, keywords: 'import file' },
  { name: 'User', Icon: User, keywords: 'person profile account' },
  { name: 'UserPlus', Icon: UserPlus, keywords: 'invite add member' },
  { name: 'Users', Icon: Users, keywords: 'team members people' },
  { name: 'Video', Icon: Video, keywords: 'camera record' },
  { name: 'Wallet', Icon: Wallet, keywords: 'money billing' },
  { name: 'Wifi', Icon: Wifi, keywords: 'network signal' },
  { name: 'X', Icon: X, keywords: 'close dismiss cancel' },
  { name: 'XCircle', Icon: XCircle, keywords: 'error fail' },
  { name: 'Zap', Icon: Zap, keywords: 'fast lightning power' },
  { name: 'ZoomIn', Icon: ZoomIn, keywords: 'magnify' },
]

export default function IconsToolPage() {
  const [query, setQuery] = React.useState('')

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ICONS
    return ICONS.filter(
      (e) => e.name.toLowerCase().includes(q) || (e.keywords ?? '').includes(q),
    )
  }, [query])

  async function copy(entry: Entry) {
    const jsx = `<${entry.name === 'LinkIcon' ? 'Link' : entry.name} className="h-4 w-4" />`
    try {
      await navigator.clipboard.writeText(jsx)
      toast.success(`Copied ${jsx}`, {
        description: `import { ${entry.name === 'LinkIcon' ? 'Link' : entry.name} } from 'lucide-react'`,
      })
    } catch {
      toast.error('Clipboard blocked')
    }
  }

  return (
    <ToolLayout
      name="Icon Browser"
      tagline="The icon set every block in the catalog already uses"
      icon={<Grid3x3 className="h-5 w-5" />}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <label htmlFor="icon-q" className="sr-only">
            Search icons
          </label>
          <Input
            id="icon-q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="delete, user, chart…"
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {results.length} of {ICONS.length}
        </span>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
          <p className="text-sm font-semibold">Nothing matched “{query}”.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This is a curated set of {ICONS.length}. The full ~1,600 are at{' '}
            <a
              href="https://lucide.dev/icons"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-primary hover:underline"
            >
              lucide.dev
            </a>{' '}
            — every one of them works the same way.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {results.map((entry) => (
            <button
              key={entry.name}
              type="button"
              onClick={() => void copy(entry)}
              title={`Copy <${entry.name} />`}
              className={cn(
                'group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 p-2 transition-all',
                'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <entry.Icon aria-hidden className="h-5 w-5 text-foreground" />
              <span className="w-full truncate text-center text-[10px] text-muted-foreground group-hover:text-foreground">
                {entry.name}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Click any icon to copy its JSX. All of them come from{' '}
        <a
          href="https://lucide.dev"
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium text-primary hover:underline"
        >
          lucide-react
        </a>
        , the one dependency blocks in this catalog declare.
      </p>
    </ToolLayout>
  )
}
