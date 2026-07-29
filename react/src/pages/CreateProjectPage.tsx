import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Plus, Trash2, GripVertical, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { projectsApi } from '@/api/projects'
import { orgsApi } from '@/api/organizations'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import type { AnswerType } from '@/types'

const STEPS = ['projectInfo', 'observationFields', 'successMessage', 'linkedOrgs'] as const
type Step = (typeof STEPS)[number]

const FIELD_TYPES: { value: AnswerType; label: string }[] = [
  { value: 'STR', label: 'Text' },
  { value: 'INT', label: 'Integer' },
  { value: 'FLOAT', label: 'Decimal' },
  { value: 'BOOL', label: 'Yes/No' },
  { value: 'CHOICE', label: 'Single choice' },
  { value: 'MCHOICE', label: 'Multiple choice' },
  { value: 'DATE', label: 'Date' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'FILE', label: 'File' },
]

interface FieldDef {
  id: string
  label: Record<string, string>
  type: AnswerType
  required: boolean
  allowOther: boolean
  choices: string[]
}

interface ProjectFormData {
  name: Record<string, string>
  description: Record<string, string>
  cover: File | null
  isPrivate: boolean
  password: string
  isGlobal: boolean
  fuzzy: boolean
  fuzzyResolution: number
  publicMap: boolean
  fields: FieldDef[]
  postObservationMessage: Record<string, string>
  organizationIds: number[]
}

const LANGS = ['en', 'es', 'pt', 'it']

export function CreateProjectPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const lang = useTranslationLang()
  const [step, setStep] = useState<Step>('projectInfo')
  const [activeLang, setActiveLang] = useState(lang)

  const [formData, setFormData] = useState<ProjectFormData>({
    name: {},
    description: {},
    cover: null,
    isPrivate: false,
    password: '',
    isGlobal: true,
    fuzzy: false,
    fuzzyResolution: 10,
    publicMap: false,
    fields: [],
    postObservationMessage: {},
    organizationIds: [],
  })

  const { data: myOrgs = [] } = useQuery({
    queryKey: ['orgs-mine'],
    queryFn: orgsApi.mine,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      fd.append('name', JSON.stringify(formData.name))
      fd.append('description', JSON.stringify(formData.description))
      fd.append('is_private', String(formData.isPrivate))
      fd.append('is_global', String(formData.isGlobal))
      fd.append('fuzzy', String(formData.fuzzy))
      fd.append('fuzzy_resolution', String(formData.fuzzyResolution))
      fd.append('public_map', String(formData.publicMap))
      fd.append('post_observation_message', JSON.stringify(formData.postObservationMessage))
      if (formData.cover) fd.append('cover', formData.cover)
      if (formData.isPrivate && formData.password) fd.append('password', formData.password)
      formData.organizationIds.forEach((id) => fd.append('organizations', String(id)))
      return projectsApi.create(fd)
    },
    onSuccess: (project) => {
      toast({ title: 'Project created!' })
      navigate(`/projects/${project.id}`)
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  const stepIndex = STEPS.indexOf(step)
  const isLast = stepIndex === STEPS.length - 1

  const set = <K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }))

  const setLocalizedField = (
    field: 'name' | 'description' | 'postObservationMessage',
    l: string,
    value: string
  ) =>
    setFormData((prev) => ({ ...prev, [field]: { ...prev[field], [l]: value } }))

  const addField = () => {
    set('fields', [
      ...formData.fields,
      { id: crypto.randomUUID(), label: {}, type: 'STR', required: false, allowOther: false, choices: [] },
    ])
  }

  const updateField = (id: string, patch: Partial<FieldDef>) =>
    set('fields', formData.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)))

  const removeField = (id: string) =>
    set('fields', formData.fields.filter((f) => f.id !== id))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 md:px-6 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold">{t('newProject')}</h1>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 md:ml-auto overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 shrink-0">
              <Button
                variant={step === s ? 'default' : i < stepIndex ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStep(s)}
                className="rounded-full h-7 px-3 text-xs"
              >
                {i < stepIndex && <Check className="h-3 w-3 mr-1" />}
                {t(s)}
              </Button>
              {i < STEPS.length - 1 && <span className="text-muted-foreground text-xs">›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full">

        {/* ── Step 1: Project Info ─────────────────────────── */}
        {step === 'projectInfo' && (
          <div className="space-y-6">
            <Tabs value={activeLang} onValueChange={setActiveLang}>
              <TabsList>
                {LANGS.map((l) => <TabsTrigger key={l} value={l}>{l.toUpperCase()}</TabsTrigger>)}
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label>{t('name')} ({activeLang})</Label>
              <Input
                value={formData.name[activeLang] ?? ''}
                onChange={(e) => setLocalizedField('name', activeLang, e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('description')} ({activeLang})</Label>
              <Textarea
                value={formData.description[activeLang] ?? ''}
                onChange={(e) => setLocalizedField('description', activeLang, e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Cover image</Label>
              <Input type="file" accept="image/*" onChange={(e) => set('cover', e.target.files?.[0] ?? null)} />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Switch id="private" checked={formData.isPrivate} onCheckedChange={(v) => set('isPrivate', v)} />
                <Label htmlFor="private">Private project</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="global" checked={formData.isGlobal} onCheckedChange={(v) => set('isGlobal', v)} />
                <Label htmlFor="global">Global</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="fuzzy" checked={formData.fuzzy} onCheckedChange={(v) => set('fuzzy', v)} />
                <Label htmlFor="fuzzy">{t('fuzzyMode')}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="publicMap" checked={formData.publicMap} onCheckedChange={(v) => set('publicMap', v)} />
                <Label htmlFor="publicMap">{t('publicMap')}</Label>
              </div>
            </div>

            {formData.isPrivate && (
              <div className="space-y-2">
                <Label>{t('projectPassword')}</Label>
                <Input type="password" value={formData.password} onChange={(e) => set('password', e.target.value)} />
              </div>
            )}

            {formData.fuzzy && (
              <div className="space-y-2">
                <Label>Fuzzy resolution (1–15)</Label>
                <Input
                  type="number" min={1} max={15}
                  value={formData.fuzzyResolution}
                  onChange={(e) => set('fuzzyResolution', Number(e.target.value))}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Observation Fields ───────────────────── */}
        {step === 'observationFields' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Define the fields users will fill in per observation.</p>
              <Button size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-1" /> {t('addField')}
              </Button>
            </div>

            {formData.fields.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                No fields yet. Add one above.
              </div>
            )}

            {formData.fields.map((field, idx) => (
              <Card key={field.id}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Field {idx + 1}</CardTitle>
                    <Button
                      size="icon" variant="ghost"
                      className="ml-auto h-7 w-7 text-destructive"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  <Tabs value={activeLang} onValueChange={setActiveLang}>
                    <TabsList className="h-7">
                      {LANGS.map((l) => (
                        <TabsTrigger key={l} value={l} className="text-xs px-2 h-6">{l.toUpperCase()}</TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>

                  <div className="space-y-1">
                    <Label className="text-xs">{t('fieldLabel')} ({activeLang})</Label>
                    <Input
                      value={field.label[activeLang] ?? ''}
                      onChange={(e) =>
                        updateField(field.id, { label: { ...field.label, [activeLang]: e.target.value } })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('fieldType')}</Label>
                      <Select value={field.type} onValueChange={(v) => updateField(field.id, { type: v as AnswerType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((ft) => (
                            <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-3 pb-0.5">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`req-${field.id}`}
                          checked={field.required}
                          onCheckedChange={(v) => updateField(field.id, { required: v })}
                        />
                        <Label htmlFor={`req-${field.id}`} className="text-xs">{t('required')}</Label>
                      </div>
                    </div>
                  </div>

                  {(field.type === 'CHOICE' || field.type === 'MCHOICE') && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('choices')} (one per line)</Label>
                      <Textarea
                        rows={3}
                        value={field.choices.join('\n')}
                        onChange={(e) =>
                          updateField(field.id, { choices: e.target.value.split('\n').filter(Boolean) })
                        }
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <Switch
                          id={`other-${field.id}`}
                          checked={field.allowOther}
                          onCheckedChange={(v) => updateField(field.id, { allowOther: v })}
                        />
                        <Label htmlFor={`other-${field.id}`} className="text-xs">{t('allowOther')}</Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Step 3: Success Message ──────────────────────── */}
        {step === 'successMessage' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Optional message shown to users after submitting an observation.
            </p>
            <Tabs value={activeLang} onValueChange={setActiveLang}>
              <TabsList>
                {LANGS.map((l) => <TabsTrigger key={l} value={l}>{l.toUpperCase()}</TabsTrigger>)}
              </TabsList>
            </Tabs>
            <div className="space-y-2">
              <Label>{t('successMessage')} ({activeLang})</Label>
              <Textarea
                value={formData.postObservationMessage[activeLang] ?? ''}
                onChange={(e) => setLocalizedField('postObservationMessage', activeLang, e.target.value)}
                rows={5}
              />
            </div>
          </div>
        )}

        {/* ── Step 4: Organizations ────────────────────────── */}
        {step === 'linkedOrgs' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Link this project to one or more of your organizations (optional).</p>
            {myOrgs.length === 0 ? (
              <p className="text-muted-foreground text-sm">You have no organizations.</p>
            ) : (
              myOrgs.map((org) => {
                const selected = formData.organizationIds.includes(org.id)
                return (
                  <Card
                    key={org.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${selected ? 'border-primary ring-1 ring-primary' : ''}`}
                    onClick={() =>
                      set(
                        'organizationIds',
                        selected
                          ? formData.organizationIds.filter((id) => id !== org.id)
                          : [...formData.organizationIds, org.id]
                      )
                    }
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      {org.logo && (
                        <img src={org.logo} alt="" className="h-8 w-8 rounded-full object-cover" />
                      )}
                      <span className="font-medium text-sm flex-1">{org.principalName || org.name}</span>
                      {selected && <Badge>Selected</Badge>}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex justify-between items-center px-6 py-4 border-t shrink-0">
        <Button variant="outline" disabled={stepIndex === 0} onClick={() => setStep(STEPS[stepIndex - 1])}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {!isLast ? (
          <Button onClick={() => setStep(STEPS[stepIndex + 1])}>
            Next <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? t('loading') : t('create')}
          </Button>
        )}
      </div>
    </div>
  )
}
