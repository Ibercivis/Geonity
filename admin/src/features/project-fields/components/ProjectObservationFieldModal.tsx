import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Columns3 } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectObservationField, ProjectObservationFieldFormValues } from '@/types/projectObservationField'

type ProjectObservationFieldModalProps = {
  open: boolean
  editingProjectObservationFieldId: number | null
  projectObservationField: ProjectObservationField | null
  projectObservationFieldsCollectionPath: string | null
  isSavingProjectObservationField: boolean
  saveProjectObservationFieldError: string | null
  canManageProjectObservationField: boolean
  onClose: () => void
  onSubmit: (values: ProjectObservationFieldFormValues) => Promise<void> | void
}

export function ProjectObservationFieldModal({
  open,
  editingProjectObservationFieldId,
  projectObservationField,
  projectObservationFieldsCollectionPath,
  isSavingProjectObservationField,
  saveProjectObservationFieldError,
  canManageProjectObservationField,
  onClose,
  onSubmit,
}: ProjectObservationFieldModalProps) {
  const { t } = useTranslation()

  const projectObservationFieldSchema = z.object({
    label: z.string().trim().min(1, t('columnModal.labelRequired')),
    fieldType: z.enum(['bool', 'choice', 'mchoice', 'number', 'text']),
    required: z.boolean(),
    public: z.boolean(),
    order: z.string(),
    choicesText: z.string(),
    helpText: z.string(),
  }).superRefine((values, context) => {
    if ((values.fieldType === 'choice' || values.fieldType === 'mchoice') && values.choicesText.split(',').map((item) => item.trim()).filter(Boolean).length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['choicesText'],
        message: t('columnModal.choicesRequired'),
      })
    }

    if (values.order.trim()) {
      const numericOrder = Number(values.order)
      if (!Number.isFinite(numericOrder)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['order'],
          message: t('columnModal.orderMustBeNumber'),
        })
      }
    }
  })

  const form = useForm<ProjectObservationFieldFormValues>({
    resolver: zodResolver(projectObservationFieldSchema),
    defaultValues: {
      label: '',
      fieldType: 'bool',
      required: false,
      public: false,
      order: '',
      choicesText: '',
      helpText: '',
    },
  })

  React.useEffect(() => {
    form.reset({
      label: projectObservationField?.label ?? '',
      fieldType:
        projectObservationField?.field_type === 'choice'
          ? 'choice'
          : projectObservationField?.field_type === 'mchoice'
            ? 'mchoice'
          : projectObservationField?.field_type === 'number'
            ? 'number'
          : projectObservationField?.field_type === 'bool'
            ? 'bool'
            : 'text',
      required: Boolean(projectObservationField?.required),
      public: Boolean(projectObservationField?.public),
      order: typeof projectObservationField?.order === 'number' ? String(projectObservationField.order) : '',
      choicesText: Array.isArray(projectObservationField?.choices) ? projectObservationField.choices.join(', ') : '',
      helpText: typeof projectObservationField?.help_text === 'string' ? projectObservationField.help_text : '',
    })
  }, [form, projectObservationField, open])

  const fieldType = form.watch('fieldType')

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden p-0 sm:max-w-lg" showCloseButton>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(async (values) => onSubmit(values))} className="flex max-h-[90vh] flex-col overflow-hidden">

            {/* Header */}
            <div className="bg-brand-900 px-6 py-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <Columns3 className="h-4 w-4 text-white/70" />
                  {editingProjectObservationFieldId ? t('columnModal.titleEdit') : t('columnModal.titleAdd')}
                </DialogTitle>
                <DialogDescription className="text-white/80">
                  {t('columnModal.description')}
                </DialogDescription>
              </DialogHeader>
            </div>

          <div className="flex-1 space-y-4 overflow-auto px-6 py-5">
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('columnModal.labelField')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('columnModal.labelPlaceholder')}
                        disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="fieldType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('columnModal.type')}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as 'bool' | 'choice' | 'mchoice' | 'number' | 'text')}
                        disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full data-[size=default]:h-10">
                            <SelectValue placeholder={t('columnModal.selectType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent align="start" className="w-[var(--anchor-width)]">
                          <SelectItem value="bool">bool</SelectItem>
                          <SelectItem value="choice">choice</SelectItem>
                          <SelectItem value="mchoice">mchoice</SelectItem>
                          <SelectItem value="number">number</SelectItem>
                          <SelectItem value="text">text</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('columnModal.order')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="10"
                          disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors space-y-0">
                      <FormLabel className="text-sm font-medium cursor-pointer">{t('columnModal.required')}</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="public"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium cursor-pointer">{t('columnModal.public')}</FormLabel>
                        <p className="text-[11px] text-muted-foreground">{t('columnModal.publicHelp')}</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {fieldType === 'choice' || fieldType === 'mchoice' ? (
                <FormField
                  control={form.control}
                  name="choicesText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('columnModal.choices')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('columnModal.choicesPlaceholder')}
                          disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="helpText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('columnModal.helpText')}</FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {saveProjectObservationFieldError ? (
                <Alert variant="destructive">
                  <AlertDescription>{saveProjectObservationFieldError}</AlertDescription>
                </Alert>
              ) : null}

              {!canManageProjectObservationField ? (
                <Alert>
                  <AlertDescription>
                    {editingProjectObservationFieldId
                      ? t('columnModal.onlyCreatorEdit')
                      : t('columnModal.onlyCreatorCreate')}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          </div>

          <div className="flex justify-between border-t bg-muted/20 px-6 py-3">
            <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={isSavingProjectObservationField}>
              {t('columnModal.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField || !canManageProjectObservationField}
            >
              {isSavingProjectObservationField
                ? t('columnModal.saving')
                : editingProjectObservationFieldId
                  ? t('columnModal.saveChanges')
                  : t('columnModal.create')}
            </Button>
          </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
