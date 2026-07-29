import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Save, Lock, Globe, MapPin, Plus, Trash2, GripVertical,
  Eye, EyeOff, Heart, ShieldX, Download, Upload, Archive, Camera, X, Mail,
  Type, Hash, Calendar, Image, File, ChevronDown, CheckSquare, QrCode, ToggleLeft,
  Copy, ExternalLink, Code,
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CoverCropDialog } from '@/components/ui/cover-crop-dialog'
import { LocalizedField, LOCALIZED_LANGS, type LocalizedLang } from '@/components/ui/localized-field'
import { CountrySelect } from '@/components/ui/country-select'
import { projectsApi } from '@/api/projects'
import { config } from '@/config/env'
import { orgsApi } from '@/api/organizations'
import { resolveLocalized, mediaUrl } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import type { AnswerType } from '@/types'


const FIELD_TYPE_ICON: Record<string, React.ElementType> = {
  STR:     Type,
  NUM:     Hash,
  INT:     Hash,
  FLOAT:   Hash,
  DATE:    Calendar,
  CHOICE:  ChevronDown,
  MCHOICE: CheckSquare,
  IMG:     Image,
  IMAGE:   Image,
  FILE:    File,
  QR:      QrCode,
  BARCODE: QrCode,
  BOOL:    ToggleLeft,
}

const FIELD_TYPE_COLOR: Record<string, string> = {
  STR:     'border-l-blue-400',
  NUM:     'border-l-emerald-400',
  INT:     'border-l-emerald-400',
  FLOAT:   'border-l-emerald-400',
  DATE:    'border-l-orange-400',
  CHOICE:  'border-l-violet-400',
  MCHOICE: 'border-l-purple-400',
  IMG:     'border-l-pink-400',
  IMAGE:   'border-l-pink-400',
  FILE:    'border-l-pink-400',
  QR:      'border-l-cyan-400',
  BARCODE: 'border-l-cyan-400',
  BOOL:    'border-l-gray-400',
}

const FIELD_TYPES: { value: AnswerType; label: string; icon: React.ElementType }[] = [
  { value: 'STR',     label: 'Text',            icon: Type },
  { value: 'NUM',     label: 'Number',           icon: Hash },
  { value: 'DATE',    label: 'Date',             icon: Calendar },
  { value: 'CHOICE',  label: 'Single choice',    icon: ChevronDown },
  { value: 'MCHOICE', label: 'Multiple choice',  icon: CheckSquare },
  { value: 'IMG',     label: 'Image',            icon: Image },
  { value: 'QR',      label: 'QR / barcode',     icon: QrCode },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChoiceDef {
  id: string
  value: string
  label: Record<string, string>
  autoValue: boolean  // true → value is derived from default label
}

function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
}

interface FieldDef {
  id: string          // local React key (UUID)
  serverId?: number   // backend question id (present for existing questions)
  question_text: Record<string, string>
  question_help: Record<string, string>
  type: AnswerType
  mandatory: boolean
  allowOther: boolean
  choices: ChoiceDef[]
  order: number
}

interface FormState {
  name: string
  description: Record<string, string>
  cover: File | null
  coverPreview: string | null
  isPrivate: boolean
  rawPassword: string
  privateData: boolean
  isGlobal: boolean
  fuzzy: boolean

  topicIds: number[]
  countries: string[]
  fields: FieldDef[]
  postObservationMessage: Record<string, string>
  showPostMessage: boolean
  organizationIds: number[]
  ended: boolean
  allowedPlatforms: 'all' | 'mobile' | 'web'
  emailOnObservation: boolean
  draft: boolean
  publicMap: boolean
}

const emptyForm = (): FormState => ({
  name: '',
  description: {},
  cover: null,
  coverPreview: null,
  isPrivate: false,
  rawPassword: '',
  privateData: false,
  isGlobal: true,
  fuzzy: false,

  topicIds: [],
  countries: [],
  fields: [],
  postObservationMessage: {},
  showPostMessage: false,
  organizationIds: [],
  ended: false,
  allowedPlatforms: 'all',
  emailOnObservation: false,
  draft: true,
  publicMap: false,
})


// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProjectFormPage() {
  const { id } = useParams<{ id?: string }>()
  const projectId = id ? Number(id) : null
  const isEdit = projectId !== null

  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const lang = useTranslationLang()


  const [form, setForm] = useState<FormState>(emptyForm())
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [coverObjectUrl, setCoverObjectUrl] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const formInitialized = useRef(false)
  const exitAfterSave = useRef(false)

  const loadFromJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string)
        const parseLang = (val: unknown): Record<string, string> => {
          if (!val) return {}
          if (typeof val === 'object' && !Array.isArray(val)) return val as Record<string, string>
          if (typeof val === 'string') {
            try { return JSON.parse(val) } catch { return { default: val } }
          }
          return {}
        }

        const questions: FieldDef[] = (json.field_form?.questions ?? []).map(
          (q: Record<string, unknown>, i: number) => ({
            id: crypto.randomUUID(),
            question_text: parseLang(q.question_text),
            question_help: parseLang(q.question_help),
            type: (q.answer_type ?? 'STR') as AnswerType,
            mandatory: Boolean(q.mandatory),
            allowOther: Boolean(q.allow_other),
            order: typeof q.order === 'number' ? q.order : i + 1,
            choices: Array.isArray(q.choices)
              ? q.choices.map((c: unknown) => {
                  const obj = c && typeof c === 'object' ? c as Record<string, unknown> : {}
                  return {
                    id: crypto.randomUUID(),
                    value: String(obj.value ?? ''),
                    label: parseLang(obj.label ?? c),
                    autoValue: false,
                  }
                })
              : [],
          })
        )

        setForm((prev) => ({
          ...prev,
          name: typeof json.name === 'string' ? json.name : (json.name?.default ?? json.name?.en ?? ''),
          description: parseLang(json.description),
          postObservationMessage: parseLang(json.post_observation_message),
          isPrivate: Boolean(json.is_private),
          draft: json.draft !== undefined ? Boolean(json.draft) : true,
          isGlobal: json.is_global !== undefined ? Boolean(json.is_global) : true,
          fuzzy: Boolean(json.fuzzy),

          topicIds: Array.isArray(json.topic) ? json.topic.filter(Number.isInteger) : [],
          countries: Array.isArray(json.countries) ? json.countries : [],
          fields: questions,
        }))

        toast({ title: t('formFromJson') })
      } catch {
        toast({ title: t('invalidJson'), variant: 'destructive' })
      }
    }
    reader.readAsText(file)
  }

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project-raw', projectId],
    queryFn: () => projectsApi.get(projectId!, true),
    enabled: isEdit,
  })

  const { data: existingFieldForm } = useQuery({
    queryKey: ['field-form-raw', project?.field_form],
    queryFn: () => projectsApi.getFieldForm(project!.field_form!, 'en'),
    enabled: isEdit && !!project?.field_form,
  })

  const { data: myOrgs = [] } = useQuery({
    queryKey: ['orgs-mine'],
    queryFn: orgsApi.mine,
  })

  const { data: topicsRaw = [] } = useQuery({
    queryKey: ['topics', lang],
    queryFn: () => projectsApi.topics(),
    staleTime: Infinity,
  })
  const topics = Array.isArray(topicsRaw)
    ? topicsRaw
    : ((topicsRaw as { results?: unknown[] }).results ?? []) as { id: number; topic: string }[]


  // Populate form when project loads (edit mode) — only once
  useEffect(() => {
    if (formInitialized.current) return
    if (!project) return
    if (isEdit && project.field_form && !existingFieldForm) return
    formInitialized.current = true
    const parseLang = (val: unknown): Record<string, string> => {
      if (!val) return {}
      if (typeof val === 'object' && !Array.isArray(val)) return val as Record<string, string>
      if (typeof val === 'string') {
        try { return JSON.parse(val) } catch { return { default: val } }
      }
      return {}
    }
    const cover = project.cover
    const coverUrl = !cover ? null
      : typeof cover === 'string' ? mediaUrl(cover)
      : Array.isArray(cover) ? (cover.length > 0 ? mediaUrl(cover[0].image) : null)
      : mediaUrl((cover as { image: string }).image)

    const projectCountries = typeof project.countries === 'string'
      ? JSON.parse(project.countries || '[]')
      : (project.countries ?? [])

    setForm({
      name: typeof project.name === 'string' ? project.name : resolveLocalized(project.name, 'en'),
      description: parseLang(project.description),
      cover: null,
      coverPreview: coverUrl,
      isPrivate: project.is_private,
      rawPassword: '',
      privateData: project.private_data ?? false,
      isGlobal: project.is_global,
      fuzzy: project.fuzzy || project.is_fuzzy || false,

      topicIds: Array.isArray(project.topic) ? project.topic : [project.topic].filter(Boolean),
      countries: projectCountries,
      fields: (existingFieldForm?.questions ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((q, i) => ({
        id: crypto.randomUUID(),
        serverId: q.id,
        question_text: typeof q.question_text === 'string'
          ? { default: q.question_text }
          : (q.question_text as Record<string, string>),
        question_help: typeof q.question_help === 'string'
          ? { default: q.question_help ?? '' }
          : ((q.question_help ?? {}) as Record<string, string>),
        type: q.answer_type,
        mandatory: q.mandatory,
        allowOther: q.allow_other,
        order: q.order ?? i + 1,
        choices: (q.choices ?? []).map((c: unknown) => {
          const obj = c && typeof c === 'object' ? c as Record<string, unknown> : {}
          return {
            id: crypto.randomUUID(),
            value: String(obj.value ?? ''),
            label: parseLang(obj.label ?? c),
            autoValue: false,
          }
        }),
      })),
      postObservationMessage: parseLang(project.post_observation_message),
      showPostMessage: project.show_post_message ?? false,
      organizationIds: (project.organizations ?? []).map((o) => typeof o === 'number' ? o : o.id),
      ended: project.ended ?? false,
      allowedPlatforms: (project.allowed_platforms as 'all' | 'mobile' | 'web') ?? 'all',
      emailOnObservation: project.email_on_observation ?? false,
      draft: project.draft ?? true,
      publicMap: project.public_map ?? false,
    })
  }, [project, existingFieldForm])

  const [fieldLang, setFieldLang] = useState<LocalizedLang>('default')
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const setLoc = (field: 'description' | 'postObservationMessage', l: string, val: string) =>
    setForm((prev) => ({ ...prev, [field]: { ...prev[field], [l]: val } }))

  const validateChoices = (): string | null => {
    for (const field of form.fields) {
      if (field.type !== 'CHOICE' && field.type !== 'MCHOICE') continue
      const values = field.choices.map((c) => c.value).filter(Boolean)
      const unique = new Set(values)
      if (unique.size !== values.length) {
        const label = resolveLocalized(field.question_text, lang) || `Field ${field.order}`
        return `"${label}" has duplicate choice values`
      }
    }
    return null
  }

  // Submit
  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', JSON.stringify(form.description))
      fd.append('is_private', String(form.isPrivate))
      fd.append('is_global', String(form.isGlobal))
      fd.append('fuzzy', String(form.fuzzy))

      fd.append('private_data', String(form.privateData))
      fd.append('post_observation_message', JSON.stringify(form.postObservationMessage))
      fd.append('show_post_message', String(form.showPostMessage))
      if (form.cover) fd.append('cover', form.cover)
      if (form.isPrivate && form.rawPassword) fd.append('raw_password', form.rawPassword)
      fd.append('topic', JSON.stringify(form.topicIds))
      fd.append('organizations_write', JSON.stringify(form.organizationIds))
      fd.append('ended', String(form.ended))
      fd.append('allowed_platforms', form.allowedPlatforms)
      fd.append('email_on_observation', String(form.emailOnObservation))
      fd.append('draft', String(form.draft))
      fd.append('public_map', String(form.publicMap))
      if (!form.isGlobal) fd.append('countries', JSON.stringify(form.countries))

      const buildQuestions = () => form.fields.map((f, i) => ({
        ...(f.serverId !== undefined ? { id: f.serverId } : {}),
        question_text: f.question_text,
        question_help: Object.keys(f.question_help).length > 0 ? f.question_help : null,
        answer_type: f.type,
        mandatory: f.mandatory,
        order: i + 1,
        allow_other: f.allowOther,
        choices: (f.type === 'CHOICE' || f.type === 'MCHOICE') && f.choices.length > 0
          ? f.choices.map((c) => ({ value: c.value, label: c.label }))
          : null,
      }))

      if (isEdit) {
        if (form.cover) {
          // Cover changed: multipart/form-data, field_form as JSON string
          if (existingFieldForm || form.fields.length > 0) {
            fd.append('field_form', JSON.stringify({ questions: buildQuestions() }))
          }
          return projectsApi.update(projectId!, fd)
        } else {
          // No cover change: application/json, field_form as nested object
          const body: Record<string, unknown> = {
            name: form.name,
            description: form.description,
            is_private: form.isPrivate,
            is_global: form.isGlobal,
            fuzzy: form.fuzzy,
            private_data: form.privateData,
            post_observation_message: form.postObservationMessage,
            show_post_message: form.showPostMessage,
            topic: form.topicIds,
            organizations_write: form.organizationIds,
            ended: form.ended,
            allowed_platforms: form.allowedPlatforms,
            email_on_observation: form.emailOnObservation,
            draft: form.draft,
            public_map: form.publicMap,
          }
          if (!form.isGlobal) body.countries = form.countries
          if (form.isPrivate && form.rawPassword) body.raw_password = form.rawPassword
          if (existingFieldForm || form.fields.length > 0) body.field_form = { questions: buildQuestions() }
          return projectsApi.update(projectId!, body)
        }
      } else {
        // CREATE: multipart/form-data, field_form as JSON string
        if (form.fields.length > 0) {
          fd.append('field_form', JSON.stringify({ questions: buildQuestions() }))
        }
        return projectsApi.create(fd)
      }
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      if (isEdit) {
        qc.invalidateQueries({ queryKey: ['project', projectId] })
        qc.invalidateQueries({ queryKey: ['project-raw', projectId] })
        qc.invalidateQueries({ queryKey: ['field-form-raw', project?.field_form] })
        qc.invalidateQueries({ queryKey: ['field-form', project?.field_form] })
      }
      toast({ title: isEdit ? t('projectSaved') : t('projectCreated') })
      if (exitAfterSave.current) {
        navigate(`/projects/${saved.id}`, { replace: true })
      } else if (!isEdit) {
        // After create, land on the new project's edit page so the user can keep editing
        navigate(`/projects/${saved.id}/edit`, { replace: true })
      }
      exitAfterSave.current = false
    },
    onError: (error) => {
      const apiData = (error as { response?: { data?: Record<string, unknown> } }).response?.data
      const raw = apiData?.draft
      const draftMsg = typeof raw === 'string'
        ? raw
        : Array.isArray(raw) && typeof raw[0] === 'string'
          ? raw[0]
          : null
      if (draftMsg) {
        set('draft', true) // revert switch — server kept it as draft
        toast({ title: draftMsg, variant: 'destructive' })
      } else {
        toast({ title: t('error'), variant: 'destructive' })
      }
    },
  })

  // Field builder helpers
  const lastFieldRef = useRef<HTMLDivElement>(null)
  const scrollToLast = useRef(false)

  useEffect(() => {
    if (scrollToLast.current && lastFieldRef.current) {
      lastFieldRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      scrollToLast.current = false
    }
  }, [form.fields.length])

  const addField = () => {
    scrollToLast.current = true
    set('fields', [
      ...form.fields,
      {
        id: crypto.randomUUID(),
        question_text: {},
        question_help: {},
        type: 'STR',
        mandatory: false,
        allowOther: false,
        choices: [],
        order: form.fields.length + 1,
      },
    ])
  }

  const updateField = (fid: string, patch: Partial<FieldDef>) =>
    set('fields', form.fields.map((f) => (f.id === fid ? { ...f, ...patch } : f)))

  const removeField = (fid: string) =>
    set('fields', form.fields.filter((f) => f.id !== fid))

  const addChoiceWithLabel = (fid: string, lang: string, label: string) => {
    if (!label.trim()) return
    const field = form.fields.find((f) => f.id === fid)!
    const newLabel = { [lang]: label.trim() }
    const base = lang === 'default' ? slugify(label.trim()) : slugify(label.trim())
    const otherValues = field.choices.map((x) => x.value)
    let candidate = base
    let n = 2
    while (otherValues.includes(candidate)) candidate = `${base}_${n++}`
    updateField(fid, {
      choices: [
        ...field.choices,
        { id: crypto.randomUUID(), value: candidate, label: newLabel, autoValue: false },
      ],
    })
  }

  const updateChoice = (fid: string, cid: string, lang: string, val: string) => {
    const field = form.fields.find((f) => f.id === fid)!
    updateField(fid, {
      choices: field.choices.map((c) => {
        if (c.id !== cid) return c
        const newLabel = { ...c.label, [lang]: val }
        if (!c.autoValue || lang !== 'default') return { ...c, label: newLabel }
        const base = slugify(val)
        const otherValues = field.choices.filter((x) => x.id !== cid).map((x) => x.value)
        let candidate = base
        let n = 2
        while (otherValues.includes(candidate)) candidate = `${base}_${n++}`
        return { ...c, label: newLabel, value: candidate }
      }),
    })
  }

  const removeChoice = (fid: string, cid: string) => {
    const field = form.fields.find((f) => f.id === fid)!
    updateField(fid, { choices: field.choices.filter((c) => c.id !== cid) })
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = form.fields.findIndex((f) => f.id === active.id)
    const newIndex = form.fields.findIndex((f) => f.id === over.id)
    set('fields', arrayMove(form.fields, oldIndex, newIndex))
  }

  const previewName = form.name || 'Project name'
  const previewCover = coverObjectUrl ?? form.coverPreview

  useEffect(() => {
    if (!form.cover) {
      if (coverObjectUrl) { URL.revokeObjectURL(coverObjectUrl); setCoverObjectUrl(null) }
      return
    }
    const url = URL.createObjectURL(form.cover)
    setCoverObjectUrl(url)
    return () => { URL.revokeObjectURL(url) }
  }, [form.cover])

  const handleCropConfirm = (file: File) => {
    set('cover', file)
    if (cropSrc) { URL.revokeObjectURL(cropSrc); setCropSrc(null) }
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  if (isEdit && projectLoading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">{t('loading')}</div>
  }

  const projectOrgs = (project?.organizations ?? []) as { id: number; principalName?: string; name?: string; logo?: string | null }[]
  const mergedOrgs = [
    ...myOrgs,
    ...projectOrgs.filter((po) => !myOrgs.some((o) => o.id === po.id)),
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-3 border-b shrink-0 overflow-x-auto">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold truncate flex-1 min-w-0">
          {isEdit ? `${t('edit')}: ${form.name || '…'}` : t('newProject')}
        </h1>
        <div className="flex gap-2 shrink-0">
          {!isEdit && (
            <>
              <input
                ref={importRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) loadFromJson(file)
                  e.target.value = ''
                }}
              />
              <Button
                variant="outline"
                onClick={() => importRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                Import JSON
              </Button>
            </>
          )}
          {isEdit && projectId && (
            <Button
              variant="outline"
              onClick={async () => {
                const blob = await projectsApi.exportJson(projectId)
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `project-${projectId}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              <Download className="h-4 w-4 mr-1" /> Export JSON
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              const err = validateChoices()
              if (err) { toast({ title: err, variant: 'destructive' }); return }
              exitAfterSave.current = false
              saveMutation.mutate()
            }}
            disabled={saveMutation.isPending || !form.name.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending && !exitAfterSave.current ? t('loading') : t('saveAndContinue')}
          </Button>
          <Button
            onClick={() => {
              const err = validateChoices()
              if (err) { toast({ title: err, variant: 'destructive' }); return }
              exitAfterSave.current = true
              saveMutation.mutate()
            }}
            disabled={saveMutation.isPending || !form.name.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending && exitAfterSave.current ? t('loading') : t('saveAndExit')}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex">

        {/* Left: tabs */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="info" className="h-full flex flex-col">
            <div className="px-3 md:px-6 pt-3 border-b sticky top-0 bg-background z-10 overflow-x-auto">
              <TabsList className="w-full justify-start rounded-none border-0 bg-transparent p-0 gap-1 h-auto">
                {[
                  { value: 'info',    label: t('projectInfo') },
                  { value: 'fields',  label: t('observationFields') },
                  { value: 'message', label: t('successMessage') },
                  { value: 'orgs',    label: t('linkedOrgs') },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 max-w-2xl">

              {/* ── Info ───────────────────────────────────────── */}
              <TabsContent value="info" className="mt-0 pt-6 space-y-6">

                {/* Name — single string */}
                <div className="space-y-1.5">
                  <Label>{t('name')}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Project name"
                  />
                </div>

                <LocalizedField
                  label={t('description')}
                  value={form.description}
                  onChange={(l, v) => setLoc('description', l, v)}
                  multiline
                  rows={4}
                />

                {/* Cover */}
                <div className="space-y-1.5">
                  <Label>{t('cover')}</Label>
                  <div
                    className="relative w-1/2 aspect-[3/2] rounded-xl bg-muted overflow-hidden group cursor-pointer border border-input"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {(previewCover) ? (
                      <img src={previewCover} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground">
                        <Camera className="h-6 w-6" />
                        <span className="text-xs">{t('clickToAddCover')}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm">
                      <Camera className="h-5 w-5 mr-2" /> {t('changeCover')}
                    </div>
                  </div>
                  {form.cover && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        set('cover', null)
                        set('coverPreview', null)
                        if (coverInputRef.current) coverInputRef.current.value = ''
                      }}
                    >
                      Remove cover
                    </Button>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => setCropSrc(reader.result as string)
                      reader.readAsDataURL(file)
                    }}
                  />
                </div>

                {/* Topics — select + chips */}
                {topics.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t('topics')}</Label>
                    <Select
                      onValueChange={(val) => {
                        const id = Number(val)
                        if (!form.topicIds.includes(id))
                          set('topicIds', [...form.topicIds, id])
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectTopic')} />
                      </SelectTrigger>
                      <SelectContent>
                        {topics
                          .filter((tp) => !form.topicIds.includes(tp.id))
                          .map((tp) => (
                            <SelectItem key={tp.id} value={String(tp.id)}>
                              {tp.topic}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {form.topicIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {form.topicIds.map((id) => {
                          const tp = topics.find((t) => t.id === id)
                          if (!tp) return null
                          return (
                            <Badge key={id} variant="secondary" className="gap-1 pr-1">
                              {tp.topic}
                              <button
                                type="button"
                                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                onClick={() => set('topicIds', form.topicIds.filter((x) => x !== id))}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Toggles — ordered: Allowed platforms, Private+PrivateData, Fuzzy+Ended, Global */}

                {/* Allowed platforms */}
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{t('allowedPlatforms')}</p>
                    </div>
                    <div className="flex rounded-md border overflow-hidden">
                      {(['all', 'mobile', 'web'] as const).map((val, i) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => set('allowedPlatforms', val)}
                          className={`flex-1 py-1.5 text-sm transition-colors ${i > 0 ? 'border-l' : ''} ${
                            form.allowedPlatforms === val
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {val === 'all' ? t('all') : val === 'mobile' ? t('mobile') : t('web')}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Switches — clean list, no frames */}
                <div className="divide-y">

                  {/* 1. Draft / Published */}
                  <div className="flex items-center gap-3 py-3">
                    <Switch checked={!form.draft} onCheckedChange={(v) => set('draft', !v)} />
                    {form.draft
                      ? <EyeOff className="h-4 w-4 text-amber-500 shrink-0" />
                      : <Eye className="h-4 w-4 text-green-600 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${form.draft ? 'text-amber-500' : 'text-green-600'}`}>
                        {form.draft ? t('draft') : t('published')}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('draftDesc')}</p>
                    </div>
                  </div>

                  {/* 2. Private */}
                  <div className="flex items-center gap-3 py-3">
                    <Switch checked={form.isPrivate} onCheckedChange={(v) => set('isPrivate', v)} />
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t('private')}</p>
                      <p className="text-xs text-muted-foreground">{t('privateDesc')}</p>
                    </div>
                  </div>

                  {/* 3. Public map */}
                  <div className="py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch checked={form.publicMap} onCheckedChange={(v) => set('publicMap', v)} />
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        {form.publicMap && isEdit ? (
                          <a
                            href={`/map/${projectId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            {t('publicMap')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-sm font-medium">{t('publicMap')}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{t('publicMapDesc')}</p>
                      </div>
                    </div>
                    {form.publicMap && isEdit && (() => {
                      const mapUrl = `${window.location.origin}/map/${projectId}`
                      const apiUrl = `${config.apiUrl}/project/${projectId}/public-map/?zoom=11`
                      const embedCode = `<iframe src="${mapUrl}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`
                      const copyAndToast = (text: string) => {
                        navigator.clipboard.writeText(text)
                        toast({ title: t('copied') })
                      }
                      return (
                        <div className="flex gap-2 pl-[calc(2.5rem+1rem)]">
                          <button type="button" title={mapUrl} onClick={() => copyAndToast(mapUrl)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border rounded px-1.5 py-0.5 transition-colors">
                            <Copy className="h-3 w-3" />{t('copyMapUrl')}
                          </button>
                          <button type="button" title={apiUrl} onClick={() => copyAndToast(apiUrl)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border rounded px-1.5 py-0.5 transition-colors">
                            <Copy className="h-3 w-3" />{t('copyApiEndpoint')}
                          </button>
                          <button type="button" title={embedCode} onClick={() => copyAndToast(embedCode)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border rounded px-1.5 py-0.5 transition-colors">
                            <Code className="h-3 w-3" />{t('copyEmbed')}
                          </button>
                        </div>
                      )
                    })()}
                  </div>

                  {/* 4. Private data */}
                  <div className="flex items-center gap-3 py-3">
                    <Switch checked={form.privateData} onCheckedChange={(v) => set('privateData', v)} />
                    <ShieldX className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t('privateData')}</p>
                      <p className="text-xs text-muted-foreground">{t('privateDataDesc')}</p>
                    </div>
                  </div>

                  {/* 5. Fuzzy */}
                  <div className="flex items-center gap-3 py-3">
                    <Switch checked={form.fuzzy} onCheckedChange={(v) => set('fuzzy', v)} />
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t('fuzzyMode')}</p>
                      <p className="text-xs text-muted-foreground">{t('fuzzyModeDesc')}</p>
                    </div>
                  </div>

                  {/* 6. Global */}
                  <div className="flex items-center gap-3 py-3">
                    <Switch checked={form.isGlobal} onCheckedChange={(v) => set('isGlobal', v)} />
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t('global')}</p>
                      <p className="text-xs text-muted-foreground">{t('globalDesc')}</p>
                    </div>
                  </div>

                  {/* 7. Ended */}
                  <div className="flex items-center gap-3 py-3">
                    <Switch checked={form.ended} onCheckedChange={(v) => set('ended', v)} />
                    <Archive className={`h-4 w-4 shrink-0 ${form.ended ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${form.ended ? 'text-destructive' : ''}`}>{t('ended')}</p>
                      <p className="text-xs text-muted-foreground">{t('projectEndedDesc')}</p>
                    </div>
                  </div>

                  {/* 8. Email on observation */}
                  <div className="flex items-center gap-3 py-3">
                    <Switch checked={form.emailOnObservation} onCheckedChange={(v) => set('emailOnObservation', v)} />
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t('emailOnObservation')}</p>
                      <p className="text-xs text-muted-foreground">{t('emailOnObservationDesc')}</p>
                    </div>
                  </div>

                </div>

                {/* Password — below switches */}
                {form.isPrivate && (
                  <div className="space-y-1.5">
                    <Label>{t('projectPassword')}</Label>
                    <Input
                      type="password"
                      value={form.rawPassword}
                      placeholder={isEdit ? t('leaveBlankToKeep') : t('setPassword')}
                      onChange={(e) => set('rawPassword', e.target.value)}
                    />
                  </div>
                )}

                {/* Countries — select + chips, only when not global */}
                {!form.isGlobal && (
                  <div className="space-y-2">
                    <Label>{t('countries')}</Label>
                    <CountrySelect
                      value=""
                      placeholder={t('selectCountry')}
                      exclude={form.countries}
                      lang={lang}
                      onChange={(code) => {
                        if (code && !form.countries.includes(code))
                          set('countries', [...form.countries, code])
                      }}
                    />
                    {form.countries.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {form.countries.map((code) => (
                          <Badge key={code} variant="secondary" className="gap-1 pr-1">
                            {code}
                            <button
                              type="button"
                              className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                              onClick={() => set('countries', form.countries.filter((x) => x !== code))}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ── Observation Fields ─────────────────────────── */}
              <TabsContent value="fields" className="mt-0">
                <div className="sticky top-0 z-10 bg-background -mx-6 px-6 py-3 border-b mb-4 flex items-center gap-3">
                  {/* Language pills */}
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    {LOCALIZED_LANGS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setFieldLang(l)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          fieldLang === l
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {l === 'default' ? '⭐' : l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" onClick={addField} className="ml-auto">
                    <Plus className="h-4 w-4 mr-1" /> {t('addField')}
                  </Button>
                </div>

                {form.fields.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-sm">No fields yet.</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={addField}>
                      <Plus className="h-4 w-4 mr-1" /> Add first field
                    </Button>
                  </div>
                )}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={form.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                {form.fields.map((field, idx) => (
                  <SortableFieldCard key={field.id} id={field.id} colorClass={FIELD_TYPE_COLOR[field.type] ?? 'border-l-gray-300'} selected={selectedFieldId === field.id} ref={idx === form.fields.length - 1 ? lastFieldRef : undefined}>
                    {(dragListeners) => (
                    <CardContent className="p-4 space-y-4" onClick={() => setSelectedFieldId(field.id)}>
                      <div className="flex items-center gap-2">
                        <span
                          {...dragListeners}
                          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                        {(() => { const Icon = FIELD_TYPE_ICON[field.type]; return Icon ? <Icon className="h-4 w-4 text-muted-foreground shrink-0" /> : null })()}
                        <span className="text-sm font-medium text-muted-foreground">Field {idx + 1}</span>
                        <Button
                          size="icon" variant="ghost"
                          className="ml-auto h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <LocalizedField
                        label="Question"
                        value={field.question_text}
                        onChange={(l, v) =>
                          updateField(field.id, { question_text: { ...field.question_text, [l]: v } })
                        }
                        activeLang={fieldLang}
                        onLangChange={setFieldLang}
                        hideLangTabs
                      />

                      <LocalizedField
                        label="Help text (optional)"
                        value={field.question_help}
                        onChange={(l, v) =>
                          updateField(field.id, { question_help: { ...field.question_help, [l]: v } })
                        }
                        placeholder="Optional hint shown below the question"
                        activeLang={fieldLang}
                        onLangChange={setFieldLang}
                        hideLangTabs
                      />

                      <div className="flex gap-4 items-end">
                        <div className="space-y-1.5 flex-1">
                          <Label className="text-xs">{t('fieldType')}</Label>
                          <Select
                            value={field.type}
                            onValueChange={(v) => updateField(field.id, { type: v as AnswerType })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map((ft) => (
                                <SelectItem key={ft.value} value={ft.value}>
                                  <span className="flex items-center gap-2">
                                    <ft.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    {ft.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 pb-0.5">
                          <Switch
                            id={`req-${field.id}`}
                            checked={field.mandatory}
                            onCheckedChange={(v) => updateField(field.id, { mandatory: v })}
                          />
                          <Label htmlFor={`req-${field.id}`} className="text-sm cursor-pointer">{t('required')}</Label>
                        </div>
                        {(field.type === 'CHOICE' || field.type === 'MCHOICE') && (
                          <div className="flex items-center gap-2 pb-0.5">
                            <Switch
                              id={`other-${field.id}`}
                              checked={field.allowOther}
                              onCheckedChange={(v) => updateField(field.id, { allowOther: v })}
                            />
                            <Label htmlFor={`other-${field.id}`} className="text-sm cursor-pointer">{t('allowOther')}</Label>
                          </div>
                        )}
                      </div>

                      {/* Choices — chips */}
                      {(field.type === 'CHOICE' || field.type === 'MCHOICE') && (
                        <div className="space-y-2 pl-2 border-l-2 border-muted">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">{t('choices')}</Label>
                          <ChoiceChips
                            fieldId={field.id}
                            choices={field.choices}
                            lang={fieldLang}
                            onUpdate={(cid, val) => updateChoice(field.id, cid, fieldLang, val)}
                            onRemove={(cid) => removeChoice(field.id, cid)}
                            onAdd={(label) => addChoiceWithLabel(field.id, fieldLang, label)}
                          />
                        </div>
                      )}
                    </CardContent>
                    )}
                  </SortableFieldCard>
                ))}
                </div>
                  </SortableContext>
                </DndContext>
              </TabsContent>

              {/* ── Success Message ────────────────────────────── */}
              <TabsContent value="message" className="mt-0 pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Optional message shown after submitting an observation.
                </p>
                <div className="flex items-center gap-3">
                  <Switch
                    id="show-post-message"
                    checked={form.showPostMessage}
                    onCheckedChange={(v) => setForm((prev) => ({ ...prev, showPostMessage: v }))}
                  />
                  <Label htmlFor="show-post-message">{t('showPostMessage')}</Label>
                </div>
                <LocalizedField
                  label={t('successMessage')}
                  value={form.postObservationMessage}
                  onChange={(l, v) => setLoc('postObservationMessage', l, v)}
                  multiline
                  rows={6}
                />
              </TabsContent>

              {/* ── Organizations ──────────────────────────────── */}
              <TabsContent value="orgs" className="mt-0 pt-6 space-y-3">
                <p className="text-sm text-muted-foreground">Link this project to one or more of your organizations (optional).</p>
                {mergedOrgs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You have no organizations.</p>
                ) : mergedOrgs.map((org) => {
                  const selected = form.organizationIds.includes(org.id)
                  const isMine = myOrgs.some((o) => o.id === org.id)
                  return (
                    <Card
                      key={org.id}
                      className={`transition-colors ${isMine ? 'cursor-pointer hover:bg-muted/50' : 'opacity-60 cursor-not-allowed'} ${selected ? 'border-primary ring-1 ring-primary' : ''}`}
                      onClick={() => {
                        if (!isMine) return
                        set('organizationIds', selected
                          ? form.organizationIds.filter((i) => i !== org.id)
                          : [...form.organizationIds, org.id])
                      }}
                    >
                      <CardContent className="flex items-center gap-3 p-3">
                        {org.logo && <img src={mediaUrl(org.logo)} alt="" className="h-8 w-8 rounded-full object-cover" />}
                        <span className="font-medium text-sm flex-1">{org.principalName || org.name}</span>
                        {selected && <Badge>{t('selected')}</Badge>}
                        {!isMine && <span className="text-xs text-muted-foreground">Not managed by you</span>}
                      </CardContent>
                    </Card>
                  )
                })}
              </TabsContent>

            </div>
          </Tabs>
        </div>

        {/* Right: live preview */}
        <div className="w-64 shrink-0 border-l overflow-y-auto p-5 space-y-4 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>

          <Card className="overflow-hidden">
            <div className="relative h-32 bg-muted">
              {previewCover ? (
                <img src={previewCover} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-4xl font-bold select-none">
                  {previewName[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {form.isPrivate && (
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-white shadow">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                )}
                {form.isGlobal && (
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-white shadow">
                    <Globe className="h-3.5 w-3.5" />
                  </span>
                )}
                {form.fuzzy && (
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-white shadow">
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm line-clamp-2 mb-1">{previewName}</h3>
              {form.topicIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {form.topicIds.map((tid) => {
                    const topic = topics.find((t) => t.id === tid)
                    return topic ? (
                      <Badge key={tid} variant="secondary" className="text-xs">{topic.topic}</Badge>
                    ) : null
                  })}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{isEdit ? (project?.observation_count ?? project?.contributions ?? 0) : 0}</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{isEdit ? (project?.total_likes ?? 0) : 0}</span>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="space-y-1.5 text-xs">
            <p className="font-medium uppercase tracking-wide text-muted-foreground">Settings</p>
            {[
              { active: form.isPrivate, color: 'bg-amber-500', label: form.isPrivate ? 'Private' : 'Public' },
              { active: form.isGlobal, color: 'bg-blue-500', label: form.isGlobal ? 'Global' : `${form.countries.length} countries` },
              { active: form.fuzzy, color: 'bg-purple-500', label: form.fuzzy ? 'Fuzzy' : 'Exact locations' },
              { active: form.privateData, color: 'bg-red-500', label: form.privateData ? 'Private data' : 'Public data' },
            ].map(({ active, color, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-muted-foreground">
                <div className={`h-2 w-2 rounded-full shrink-0 ${active ? color : 'bg-muted-foreground/30'}`} />
                <span>{label}</span>
              </div>
            ))}
            {form.fields.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="h-2 w-2 rounded-full shrink-0 bg-green-500" />
                <span>{form.fields.length} observation field{form.fields.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            {isEdit && project && (
              <>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Observations</span>
                  <span className="font-medium text-foreground">{project.observation_count ?? project.contributions ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> Likes</span>
                  <span className="font-medium text-foreground">{project.total_likes ?? 0}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {cropSrc && (
        <CoverCropDialog
          src={cropSrc}
          aspect={3 / 2}
          outputWidth={600}
          outputHeight={400}
          maxWidth="sm:max-w-2xl"
          onConfirm={handleCropConfirm}
          onCancel={() => {
            setCropSrc(null)
            if (coverInputRef.current) coverInputRef.current.value = ''
          }}
        />
      )}
    </div>
  )
}

// ─── Sortable field card ──────────────────────────────────────────────────────

// ─── ChoiceChips ─────────────────────────────────────────────────────────────

function ChoiceChips({ fieldId: _fieldId, choices, lang, onUpdate, onRemove, onAdd }: {
  fieldId: string
  choices: ChoiceDef[]
  lang: string
  onUpdate: (cid: string, val: string) => void
  onRemove: (cid: string) => void
  onAdd: (label: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [addValue, setAddValue] = useState('')

  const startEdit = (choice: ChoiceDef) => {
    setEditingId(choice.id)
    setEditValue(choice.label[lang] ?? choice.label['default'] ?? '')
  }

  const commitEdit = (cid: string) => {
    onUpdate(cid, editValue)
    setEditingId(null)
  }

  const commitAdd = () => {
    if (addValue.trim()) {
      onAdd(addValue.trim())
      setAddValue('')
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {choices.map((choice) => {
        const label = choice.label[lang] ?? choice.label['default'] ?? ''
        const isEditing = editingId === choice.id
        return (
          <div
            key={choice.id}
            className="group inline-flex items-center gap-1 rounded-full border bg-secondary text-secondary-foreground text-xs px-2.5 py-1 max-w-[160px]"
          >
            {isEditing ? (
              <input
                autoFocus
                className="bg-transparent outline-none w-24 text-xs"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => commitEdit(choice.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitEdit(choice.id) }
                  if (e.key === 'Escape') setEditingId(null)
                }}
              />
            ) : (
              <span
                className="cursor-text truncate max-w-[110px]"
                title={label || choice.value}
                onClick={() => startEdit(choice)}
              >
                {label || <span className="italic text-muted-foreground">{choice.value || '…'}</span>}
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(choice.id)}
              className="text-muted-foreground hover:text-destructive transition-colors leading-none shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )
      })}

      {/* Add chip */}
      <div className="inline-flex items-center gap-1 rounded-full border border-dashed text-xs px-2.5 py-1 text-muted-foreground focus-within:border-primary focus-within:text-foreground transition-colors">
        <Plus className="h-3 w-3 shrink-0" />
        <input
          className="bg-transparent outline-none w-20 text-xs placeholder:text-muted-foreground"
          placeholder="Add…"
          value={addValue}
          onChange={(e) => setAddValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitAdd() }
          }}
          onBlur={commitAdd}
        />
      </div>

      {/* Value hints */}
      {choices.length > 0 && (
        <div className="w-full flex flex-wrap gap-x-3 gap-y-0 mt-0.5">
          {choices.map((c) => c.value && (
            <span key={c.id} className="text-[10px] font-mono text-muted-foreground/50">{c.value}</span>
          ))}
        </div>
      )}
    </div>
  )
}

const SortableFieldCard = React.forwardRef<
  HTMLDivElement,
  { id: string; colorClass: string; selected: boolean; children: (dragHandleListeners: ReturnType<typeof useSortable>['listeners']) => React.ReactNode }
>(({ id, colorClass, selected, children }, scrollRef) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <Card
      ref={(el) => {
        setNodeRef(el)
        if (typeof scrollRef === 'function') scrollRef(el)
        else if (scrollRef) scrollRef.current = el
      }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border-l-4 ${colorClass} ${selected ? 'ring-1 ring-inset ring-border shadow-sm' : ''} ${isDragging ? 'opacity-50 shadow-lg z-10' : ''}`}
      {...attributes}
    >
      {children(listeners)}
    </Card>
  )
})
SortableFieldCard.displayName = 'SortableFieldCard'
