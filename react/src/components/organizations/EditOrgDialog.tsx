import { useRef, useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ImagePlus, X, Globe } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LocalizedField } from '@/components/ui/localized-field'
import { CountrySelect } from '@/components/ui/country-select'
import { CoverCropDialog } from '@/components/ui/cover-crop-dialog'
import { orgsApi } from '@/api/organizations'
import { mediaUrl } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import type { Organization } from '@/types'

const schema = z.object({
  principalName: z.string().min(1),
  url: z.string().optional(),
  contactName: z.string().optional(),
  contactMail: z.union([z.string().email(), z.literal('')]).optional(),
})
type FormValues = z.infer<typeof schema>

interface CropTarget { kind: 'logo' | 'cover'; src: string }

interface Props {
  org: Organization
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function EditOrgDialog({ org, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const qc = useQueryClient()

  const [logoCropped, setLogoCropped] = useState<{ file: File; preview: string } | null>(null)
  const [coverCropped, setCoverCropped] = useState<{ file: File; preview: string } | null>(null)
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<number[]>(org.type ?? [])
  const [description, setDescription] = useState<Record<string, string>>({})
  const [isGlobal, setIsGlobal] = useState(org.is_global ?? true)
  const [selectedCountries, setSelectedCountries] = useState<string[]>(org.countries ?? [])

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const { data: orgTypes = [] } = useQuery({
    queryKey: ['org-types'],
    queryFn: orgsApi.types,
    staleTime: Infinity,
  })

  // Fetch raw org to get all translations
  const { data: rawOrg } = useQuery({
    queryKey: ['org-raw', org.id],
    queryFn: () => orgsApi.get(org.id, true),
    enabled: open,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      principalName: org.principalName || org.principal_name || org.name || '',
      url: org.url ?? '',
      contactName: org.contactName ?? '',
      contactMail: org.contactMail ?? '',
    },
  })

  // Re-populate when raw org loads or org changes
  useEffect(() => {
    reset({
      principalName: org.principalName || org.principal_name || org.name || '',
      url: org.url ?? '',
      contactName: org.contactName ?? '',
      contactMail: org.contactMail ?? '',
    })
    setSelectedTypes(org.type ?? [])
    setIsGlobal(org.is_global ?? true)
    setSelectedCountries(org.countries ?? [])
    setLogoCropped(null)
    setCoverCropped(null)
  }, [org.id])

  useEffect(() => {
    if (!rawOrg) return
const desc = rawOrg.description
    if (desc && typeof desc === 'object' && !Array.isArray(desc)) {
      setDescription(desc as Record<string, string>)
    } else if (typeof desc === 'string') {
      try {
        const parsed = JSON.parse(desc)
        if (typeof parsed === 'object') setDescription(parsed)
        else setDescription({ default: desc })
      } catch {
        setDescription({ default: desc })
      }
    } else {
      setDescription({})
    }
  }, [rawOrg])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const fd = new FormData()
      fd.append('principalName', values.principalName)
      fd.append('description', JSON.stringify(description))
      fd.append('is_global', String(isGlobal))
      fd.append('countries', JSON.stringify(isGlobal ? [] : selectedCountries))
      if (values.url !== undefined) fd.append('url', values.url)
      if (values.contactName !== undefined) fd.append('contactName', values.contactName)
      if (values.contactMail !== undefined) fd.append('contactMail', values.contactMail)
      selectedTypes.forEach((id) => fd.append('type', String(id)))
      if (logoCropped) fd.append('logo', logoCropped.file)
      if (coverCropped) fd.append('cover', coverCropped.file)
      return orgsApi.update(org.id, fd)
    },
    onSuccess: (updated) => {
      qc.setQueryData(['org', org.id], updated)
      qc.refetchQueries({ queryKey: ['organizations'] })
      toast({ title: t('orgUpdated') })
      onOpenChange(false)
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  const openFilePicker = (kind: 'logo' | 'cover') => {
    (kind === 'logo' ? logoInputRef : coverInputRef).current?.click()
  }

  const onFileChange = (kind: 'logo' | 'cover', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (cropTarget) URL.revokeObjectURL(cropTarget.src)
    setCropTarget({ kind, src: URL.createObjectURL(file) })
    e.target.value = ''
  }

  const onCropConfirm = (file: File) => {
    if (!cropTarget) return
    URL.revokeObjectURL(cropTarget.src)
    const preview = URL.createObjectURL(file)
    if (cropTarget.kind === 'logo') {
      if (logoCropped) URL.revokeObjectURL(logoCropped.preview)
      setLogoCropped({ file, preview })
    } else {
      if (coverCropped) URL.revokeObjectURL(coverCropped.preview)
      setCoverCropped({ file, preview })
    }
    setCropTarget(null)
  }

  const toggleType = (id: number) =>
    setSelectedTypes((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const existingCover = org.cover ? mediaUrl(org.cover) : null
  const existingLogo = org.logo ? mediaUrl(org.logo) : null
  const coverPreview = coverCropped?.preview ?? existingCover
  const logoPreview = logoCropped?.preview ?? existingLogo

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editOrg')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">

            {/* Cover */}
            <div className="space-y-1">
              <Label>{t('cover')}</Label>
              <div
                className="relative rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                style={{ aspectRatio: '11/4' }}
                onClick={() => openFilePicker('cover')}
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                    {coverCropped && (
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80"
                        onClick={(e) => { e.stopPropagation(); setCoverCropped(null) }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground/50">
                    <ImagePlus className="h-8 w-8" />
                    <span className="text-xs">{t('clickToAddCover')}</span>
                  </div>
                )}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange('cover', e)} />
            </div>

            {/* Logo */}
            <div className="space-y-1">
              <Label>{t('logo')}</Label>
              <div className="flex items-center gap-3">
                <div
                  className="relative h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted overflow-hidden cursor-pointer hover:border-primary/50 transition-colors shrink-0"
                  onClick={() => openFilePicker('logo')}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground/50">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                  )}
                </div>
                {logoCropped && (
                  <Button type="button" variant="ghost" size="sm" className="text-destructive h-7"
                    onClick={() => setLogoCropped(null)}>
                    <X className="h-3.5 w-3.5 mr-1" /> {t('restoreOriginal')}
                  </Button>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange('logo', e)} />
            </div>

            {/* Name */}
            <div className="space-y-1">
              <Label>{t('name')} *</Label>
              <Input {...register('principalName')} />
              {errors.principalName && <p className="text-xs text-destructive">{errors.principalName.message}</p>}
            </div>

            {/* Description — multilingual */}
            <LocalizedField
              label={t('description')}
              value={description}
              onChange={(lang, val) => setDescription((prev) => ({ ...prev, [lang]: val }))}
              multiline
              rows={3}
            />

            {/* URL */}
            <div className="space-y-1">
              <Label>URL</Label>
              <Input {...register('url')} placeholder="https://" />
            </div>

            {/* Global + Countries */}
            <Card className={isGlobal ? 'border-primary' : ''}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t('global')}</p>
                    <p className="text-xs text-muted-foreground">{t('globalDesc')}</p>
                  </div>
                </div>
                <Switch checked={isGlobal} onCheckedChange={setIsGlobal} />
              </CardContent>
            </Card>

            {!isGlobal && (
              <div className="space-y-2">
                <Label>{t('countries')}</Label>
                <CountrySelect
                  value=""
                  placeholder={t('selectCountry')}
                  exclude={selectedCountries}
                  lang={lang}
                  onChange={(code) => {
                    if (code && !selectedCountries.includes(code))
                      setSelectedCountries((prev) => [...prev, code])
                  }}
                />
                {selectedCountries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCountries.map((code) => (
                      <Badge key={code} variant="secondary" className="gap-1 pr-1">
                        {code}
                        <button
                          type="button"
                          className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                          onClick={() => setSelectedCountries((prev) => prev.filter((x) => x !== code))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('contactName')}</Label>
                <Input {...register('contactName')} />
              </div>
              <div className="space-y-1">
                <Label>{t('contactEmail')}</Label>
                <Input {...register('contactMail')} type="email" />
                {errors.contactMail && <p className="text-xs text-destructive">{errors.contactMail.message}</p>}
              </div>
            </div>

            {/* Type */}
            {orgTypes.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t('type')}</Label>
                <div className="flex flex-wrap gap-2">
                  {orgTypes.map((ot) => {
                    const active = selectedTypes.includes(ot.id)
                    return (
                      <button
                        key={ot.id}
                        type="button"
                        onClick={() => toggleType(ot.id)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-muted-foreground/30 text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        {ot.type}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('loading') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {cropTarget && (
        <CoverCropDialog
          src={cropTarget.src}
          title={cropTarget.kind === 'logo' ? 'Crop logo' : 'Crop cover'}
          aspect={cropTarget.kind === 'logo' ? 1 : 11 / 4}
          outputWidth={cropTarget.kind === 'logo' ? 400 : 880}
          outputHeight={cropTarget.kind === 'logo' ? 400 : 320}
          fileName={cropTarget.kind === 'logo' ? 'logo.jpg' : 'cover.jpg'}
          onConfirm={onCropConfirm}
          onCancel={() => setCropTarget(null)}
        />
      )}
    </>
  )
}
