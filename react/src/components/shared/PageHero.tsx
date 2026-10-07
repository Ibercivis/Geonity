import type { ReactNode } from 'react'

interface PageHeroProps {
  title: string
  subtitle: string
  /** Large title (Home) or regular (section pages). */
  size?: 'lg' | 'md'
  children?: ReactNode
  /** Right-aligned call to action next to the title. */
  action?: ReactNode
}

/** Light header band shared by Home and Explore. */
export function PageHero({ title, subtitle, size = 'md', children, action }: PageHeroProps) {
  return (
    <section className="relative border-b bg-gradient-to-br from-sky-50 via-blue-50 to-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg aria-hidden className="absolute right-0 top-0 h-full w-1/2 text-primary/10 hidden md:block" viewBox="0 0 400 300" preserveAspectRatio="xMaxYMid slice">
          <path d="M400 0H120C170 60 90 120 160 170C230 220 190 270 260 300H400Z" fill="currentColor" />
          <circle cx="300" cy="90" r="46" fill="currentColor" />
        </svg>
      </div>
      <div className={`relative px-4 md:px-8 max-w-6xl ${size === 'lg' ? 'py-8 md:py-10' : 'py-6 md:py-8'}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={`font-bold tracking-tight leading-tight whitespace-pre-line ${size === 'lg' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}>
              {title}
            </h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </div>
          {action}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  )
}
