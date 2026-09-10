import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe, LogOut, User, Bell, Menu, BarChart3, ShieldCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import logoSrc from '@/assets/logo.webp'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAuthStore } from '@/store/auth'
import { orgsApi } from '@/api/organizations'
import { authApi } from '@/api/auth'
import { projectsApi } from '@/api/projects'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
]

export function Navbar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    // The backend sends automatic emails in Profile.language; keep it aligned with the UI choice.
    if (user) authApi.updateLanguage(code).then((p) => useAuthStore.getState().setProfile(p)).catch(() => {})
  }

  const { data: pendingOrgInvitations = [] } = useQuery({
    queryKey: ['pending-org-invitations'],
    queryFn: orgsApi.pendingInvitations,
    refetchInterval: 60_000,
    enabled: !!user,
  })

  const { data: pendingProjectInvitations = [] } = useQuery({
    queryKey: ['pending-project-invitations'],
    queryFn: projectsApi.pendingInvitations,
    refetchInterval: 60_000,
    enabled: !!user,
  })

  const pendingCount = pendingOrgInvitations.length + pendingProjectInvitations.length

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase()
    : '?'

  const authNavItems = [
    { href: '/', label: t('projects') },
    { href: '/organizations', label: t('organizations') },
    { href: '/about', label: t('about') },
  ]

  const publicNavItems = [
    { href: '/about', label: t('about') },
  ]

  const navItems = user ? authNavItems : publicNavItems

  return (
    <>
      <header className="h-14 bg-brand-dark flex items-center px-4 md:px-6 gap-3 md:gap-6 shrink-0">
        {/* Hamburger (mobile only) */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden flex items-center justify-center h-10 w-10 -ml-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link to={user ? '/' : '/about'} className="flex items-center">
          <img src={logoSrc} alt="Geonity" className="h-7 w-7 rounded-md" />
        </Link>

        {/* Inline nav links (desktop only) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-white/70 hover:text-white hover:bg-white/10',
                  location.pathname === item.href && 'bg-white/15 text-white font-medium'
                )}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          {/* Language selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 h-10 md:h-8 px-2 md:px-3">
                <Globe className="h-4 w-4" />
                <span className="text-xs font-medium uppercase">{i18n.language.slice(0, 2)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={cn(i18n.language === lang.code && 'font-semibold')}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              {/* Invitations bell */}
              <Link to="/invitations" className="relative">
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 h-10 w-10 md:h-9 md:w-9">
                  <Bell className="h-4 w-4" />
                </Button>
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white pointer-events-none">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 h-10 w-10 md:h-9 md:w-9">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary text-white">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    {t('profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/stats')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {t('statsMine')}
                  </DropdownMenuItem>
                  {user.is_staff && (
                    <DropdownMenuItem onClick={() => navigate('/admin/stats')}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {t('statsPlatform')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              size="sm"
              className="bg-white text-brand-dark hover:bg-white/90 font-semibold"
              onClick={() => navigate('/login')}
            >
              {t('login')}
            </Button>
          )}
        </div>
      </header>

      {/* Mobile nav drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <img src={logoSrc} alt="Geonity" className="h-6 w-6 rounded-md" />
              Geonity
            </SheetTitle>
          </SheetHeader>
          <nav className="p-2 flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'flex items-center px-4 py-3 text-base rounded-md transition-colors',
                  location.pathname === item.href
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground hover:bg-accent/50'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
