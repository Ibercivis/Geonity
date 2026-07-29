import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import {
  Layers, Smartphone, Globe2, Users, Lock, FileDown, ChevronRight, Apple, PlayCircle, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SiteFooter } from '@/components/shared/SiteFooter'
import logoSrc from '@/assets/logo.webp'
import img1 from '@/assets/1_quees.webp'
import img2 from '@/assets/2_proyectos_formularios.webp'
import img3 from '@/assets/3_web_movil.webp'
import img4 from '@/assets/4_multi.webp'
import img5 from '@/assets/5_organizaciones.webp'
import img6 from '@/assets/6_privacidad.webp'
import img7 from '@/assets/7_gratis.webp'
import img8 from '@/assets/8_estes_donde.webp'
import img9 from '@/assets/9_crea.webp'
import img10 from '@/assets/10_aporta.webp'
import img13 from '@/assets/13_exporta.webp'
import miguelPhoto from '@/assets/team/miguel.jpg'
import franciscoPhoto from '@/assets/team/francisco.jpg'
import germanPhoto from '@/assets/team/german.jpg'
import asunPhoto from '@/assets/team/asun.jpg'

// ── Screenshot image with glow ────────────────────────────────────────────────
function Img({ src, alt, aspect = 'aspect-video' }: { src: string; alt: string; aspect?: string }) {
  return (
    <div className={`${aspect} w-full rounded-2xl overflow-hidden
      shadow-[0_0_40px_rgba(99,102,241,0.18)] ring-1 ring-indigo-300/10`}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
    </div>
  )
}

// ── Team ──────────────────────────────────────────────────────────────────────

type TeamRole = 'idea' | 'development' | 'design' | 'testing'

interface TeamMember {
  name: string
  institution: string
  roles: TeamRole[]
  url: string
  photo: string | null
}

const TEAM: TeamMember[] = [
  {
    name: 'Miguel Sevilla-Callejo',
    institution: 'Instituto Pirenaico de Ecología (CSIC) · QGIS España',
    roles: ['idea', 'testing'],
    url: 'https://www.qgis.es/author/miguel-sevilla-callejo/',
    photo: miguelPhoto,
  },
  {
    name: 'Francisco Sanz',
    institution: 'Fundación Ibercivis',
    roles: ['idea', 'development'],
    url: 'https://ibercivis.es/',
    photo: franciscoPhoto,
  },
  {
    name: 'Germán Gil',
    institution: 'Fundación Ibercivis',
    roles: ['design'],
    url: 'https://ibercivis.es/',
    photo: germanPhoto,
  },
  {
    name: 'Asun Iguarbe',
    institution: 'Fundación Ibercivis',
    roles: ['testing'],
    url: 'https://servet.ibercivis.es/author/asuniguarbe/',
    photo: asunPhoto,
  },
]

const ROLE_STYLES: Record<TeamRole, string> = {
  idea:        'bg-violet-100 text-violet-700 border-violet-200',
  development: 'bg-blue-100 text-blue-700 border-blue-200',
  design:      'bg-rose-100 text-rose-700 border-rose-200',
  testing:     'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-500',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
]

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function TeamCard({ member, gradient }: { member: TeamMember; gradient: string }) {
  const { t } = useTranslation()
  const [imgError, setImgError] = useState(false)
  const showFallback = !member.photo || imgError

  return (
    <a
      href={member.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {showFallback ? (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white text-5xl font-bold tracking-tight">
              {getInitials(member.name)}
            </span>
          </div>
        ) : (
          <img
            src={member.photo!}
            alt={member.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{member.name}</h3>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-xs text-muted-foreground leading-snug">{member.institution}</p>
        <div className="flex flex-wrap gap-1 pt-1">
          {member.roles.map((role) => (
            <span
              key={role}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${ROLE_STYLES[role]}`}
            >
              {t(`role_${role}`)}
            </span>
          ))}
        </div>
      </div>
    </a>
  )
}

export function AboutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const ctaLabel = user ? t('exploreProjects') : t('login')
  const ctaTarget = user ? '/' : '/login'

  const features = [
    { icon: <Layers className="h-5 w-5" />,      title: t('aboutFeature1Title'), body: t('aboutFeature1Body'), img: img2, color: 'bg-violet-500/10 text-violet-600' },
    { icon: <Smartphone className="h-5 w-5" />,  title: t('aboutFeature2Title'), body: t('aboutFeature2Body'), img: img3, color: 'bg-blue-500/10 text-blue-600' },
    { icon: <Globe2 className="h-5 w-5" />,      title: t('aboutFeature3Title'), body: t('aboutFeature3Body'), img: img4, color: 'bg-teal-500/10 text-teal-600' },
    { icon: <Users className="h-5 w-5" />,       title: t('aboutFeature4Title'), body: t('aboutFeature4Body'), img: img5, color: 'bg-amber-500/10 text-amber-600' },
    { icon: <Lock className="h-5 w-5" />,        title: t('aboutFeature5Title'), body: t('aboutFeature5Body'), img: img6, color: 'bg-rose-500/10 text-rose-600' },
    { icon: <FileDown className="h-5 w-5" />,    title: t('aboutFeature6Title'), body: t('aboutFeature6Body'), img: img7, color: 'bg-green-500/10 text-green-600' },
  ]

  const steps = [
    { n: '01', title: t('aboutStep1Title'), body: t('aboutStep1Body'), img: img9 },
    { n: '02', title: t('aboutStep2Title'), body: t('aboutStep2Body'), img: img10 },
    { n: '03', title: t('aboutStep3Title'), body: t('aboutStep3Body'), img: img13 },
  ]

  return (
    <div className="h-full overflow-y-auto bg-background">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-dark text-white overflow-hidden">
        {/* Subtle radial glow behind hero image */}
        <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-none opacity-30
          bg-[radial-gradient(ellipse_at_70%_40%,rgba(99,102,241,0.5),transparent_60%)]" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img src={logoSrc} alt="Geonity" className="h-10 w-10 rounded-xl" />
              <span className="text-white/50 font-medium uppercase tracking-widest text-xs">Geonity</span>
            </div>

            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/20 text-xs font-semibold px-3 py-1">
              {t('aboutFreeTag')}
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              {t('aboutHeroTitle')}
            </h1>
            <p className="text-lg text-white/65 leading-relaxed max-w-md">
              {t('aboutHeroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                size="lg"
                className="bg-white text-brand-dark hover:bg-white/90 font-semibold gap-2"
                onClick={() => navigate(ctaTarget)}
              >
                {ctaLabel}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Logo large */}
          <div className="hidden md:flex items-center justify-center">
            <img
              src={logoSrc}
              alt="Geonity"
              className="w-64 h-64 rounded-3xl
                shadow-[0_0_100px_rgba(99,102,241,0.5)] ring-1 ring-white/10"
            />
          </div>
        </div>
      </section>

      {/* ── What is Geonity ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-5">
          <h2 className="text-3xl md:text-4xl font-bold leading-snug">
            {t('aboutWhatTitle')}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t('aboutWhatBody')}
          </p>
        </div>
        <Img src={img1} alt={t('aboutWhatTitle')} aspect="aspect-[4/3]" />
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center">
            {t('aboutFeaturesTitle')}
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-background rounded-2xl p-6 border flex flex-col
                  shadow-sm hover:shadow-[0_0_30px_rgba(99,102,241,0.12)] transition-shadow duration-300"
              >
                <div className="space-y-4 flex-1">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${f.color}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{f.body}</p>
                </div>
                <div className="mt-4">
                  <Img src={f.img} alt={f.title} aspect="aspect-video" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Web & Mobile ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
        <Img src={img8} alt={t('aboutMobileTitle')} aspect="aspect-[4/3]" />
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold leading-snug">
            {t('aboutMobileTitle')}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t('aboutMobileBody')}
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-muted/50 text-sm font-medium text-muted-foreground">
              <Apple className="h-4 w-4" />
              App Store
              <Badge variant="outline" className="text-xs ml-1">{t('aboutAppStoreSoon')}</Badge>
            </div>
            <a
              href="https://play.google.com/store/apps/details?id=es.ibercivis.geonity"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <PlayCircle className="h-4 w-4" />
              Google Play
            </a>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-14">
          <h2 className="text-3xl md:text-4xl font-bold text-center">
            {t('aboutHowTitle')}
          </h2>

          <div className="space-y-16">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}
              >
                <div className="space-y-4">
                  <span className="text-7xl font-black text-muted-foreground/15 leading-none block select-none">
                    {step.n}
                  </span>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
                <Img src={step.img} alt={step.title} aspect="aspect-[4/3]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold leading-snug">{t('teamTitle')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('teamSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map((member, i) => (
              <TeamCard key={member.name} member={member} gradient={GRADIENTS[i % GRADIENTS.length]} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-dark text-white py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none
          bg-[radial-gradient(ellipse_at_50%_80%,rgba(99,102,241,0.3),transparent_60%)]" />
        <div className="relative max-w-2xl mx-auto px-4 md:px-6 text-center space-y-6">
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/20 text-xs font-semibold px-3 py-1">
            {t('aboutFreeTag')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">{t('aboutCtaTitle')}</h2>
          <p className="text-white/65 text-lg leading-relaxed">{t('aboutCtaBody')}</p>
          <Button
            size="lg"
            className="bg-white text-brand-dark hover:bg-white/90 font-semibold gap-2"
            onClick={() => navigate(ctaTarget)}
          >
            {ctaLabel}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
