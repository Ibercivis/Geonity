import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, ExternalLink } from 'lucide-react'
import logoSrc from '@/assets/logo.webp'
import { VersionLabel } from './VersionLabel'

export function SiteFooter() {
  const { t } = useTranslation()

  return (
    <footer className="border-t bg-background shrink-0">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

        {/* Left: logo + copyright */}
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="Geonity" className="h-8 w-8 rounded-lg" />
          <div>
            <p className="font-semibold text-sm">Geonity</p>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Geonity</p>
            <VersionLabel className="text-[11px] text-muted-foreground/70" />
          </div>
        </div>

        {/* Center: links */}
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
            {t('pp.title')}
          </Link>
          <span className="hidden md:inline text-border">·</span>
          <Link to="/terms-of-use" className="hover:text-foreground transition-colors">
            {t('tou.title')}
          </Link>
          <span className="hidden md:inline text-border">·</span>
          <Link to="/delete-account" className="hover:text-foreground transition-colors">
            {t('dap.badge')}
          </Link>
          <span className="hidden md:inline text-border">·</span>
          <a
            href="mailto:info@ibercivis.es"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            info@ibercivis.es
          </a>
        </nav>

        {/* Right: Ibercivis credit */}
        <a
          href="https://ibercivis.es"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Developed by <span className="font-semibold text-foreground ml-1">Ibercivis</span>
          <ExternalLink className="h-3 w-3 ml-0.5" />
        </a>

      </div>
    </footer>
  )
}
