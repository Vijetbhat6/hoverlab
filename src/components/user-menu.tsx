'use client'

/**
 * UserMenu — header dropdown for account state.
 *
 *  - Logged out: shows a "Sign in" ghost button that links to /login.
 *  - Logged in: shows an avatar button (first initial of name/email) that
 *    opens a dropdown with the user's email, a link to /account, and a
 *    sign-out action.
 *
 * While the AuthProvider is still hydrating on first mount, we render a
 * ghost button skeleton so the header doesn't jump.
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UserMenu() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = React.useState(false)

  async function onLogout() {
    setSigningOut(true)
    try {
      await logout()
      toast.success('Signed out.')
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="hidden h-9 gap-1.5 sm:inline-flex"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="hidden h-9 gap-1.5 sm:inline-flex"
        asChild
      >
        <Link href="/login">
          <UserIcon className="h-4 w-4" /> Sign in
        </Link>
      </Button>
    )
  }

  const initial = (user.name ?? user.email).charAt(0).toUpperCase()
  const displayName = user.name ?? user.email.split('@')[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          title={displayName}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-sm font-bold text-white shadow-sm shadow-primary/30 transition-transform hover:scale-105"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">{displayName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          disabled={signingOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
