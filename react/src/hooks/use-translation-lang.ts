import { useTranslation } from 'react-i18next'

/** Returns the resolved language code (e.g. 'es', 'pt') — matches supportedLngs and what the axios interceptor sends via Accept-Language */
export function useTranslationLang() {
  const { i18n } = useTranslation()
  return i18n.resolvedLanguage ?? i18n.language.slice(0, 2)
}
