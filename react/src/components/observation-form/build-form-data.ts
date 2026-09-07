import type { ObservationQuestion } from '@/types'

/**
 * Builds the multipart body expected by the observations endpoints:
 *   field_form, geoposition (GeoJSON Point), timestamp, data (JSON [{key,value}]),
 *   plus one `image_<questionId>` part per uploaded file.
 */
export function buildObservationFormData(
  fieldFormId: number,
  questions: ObservationQuestion[],
  location: [number, number],
  answers: Record<string, unknown>,
): FormData {
  const fd = new FormData()
  fd.append('field_form', String(fieldFormId))
  fd.append('geoposition', JSON.stringify({ type: 'Point', coordinates: [location[0], location[1]] }))
  fd.append('timestamp', new Date().toISOString())

  const obsData: { key: string; value: unknown }[] = []
  for (const question of questions) {
    const key = String(question.id)
    const value = answers[key]
    if (value !== undefined && value !== null && value !== '') {
      // Handle image/file fields separately
      if (question.answer_type === 'IMG' || question.answer_type === 'IMAGE' || question.answer_type === 'FILE') {
        // ImageField yields a File (camera/gallery buttons); plain <input type=file> yields a FileList
        const file = value instanceof File ? value : value instanceof FileList ? value[0] : null
        if (file) fd.append(`image_${key}`, file)
      } else if (question.answer_type === 'MCHOICE' && Array.isArray(value) && value.length === 0) {
        // skip empty multi-choice
      } else {
        obsData.push({ key, value })
      }
    }
  }
  fd.append('data', JSON.stringify(obsData))
  return fd
}
