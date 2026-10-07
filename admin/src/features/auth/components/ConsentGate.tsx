import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

type ConsentGateProps = {
  isAccepting: boolean
  error: string | null
  onAccept: () => Promise<void> | void
}

export function ConsentGate({ isAccepting, error, onAccept }: ConsentGateProps) {
  const { t } = useTranslation()
  const [termsChecked, setTermsChecked] = React.useState(false)
  const [privacyChecked, setPrivacyChecked] = React.useState(false)

  const canAccept = termsChecked && privacyChecked && !isAccepting

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('consent.title')}</CardTitle>
          <CardDescription>{t('consent.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">{t('consent.body')}</p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={termsChecked}
                onCheckedChange={(checked) => setTermsChecked(Boolean(checked))}
                disabled={isAccepting}
                className="mt-0.5 shrink-0"
              />
              <span className="text-sm leading-snug">{t('consent.termsLabel')}</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={privacyChecked}
                onCheckedChange={(checked) => setPrivacyChecked(Boolean(checked))}
                disabled={isAccepting}
                className="mt-0.5 shrink-0"
              />
              <span className="text-sm leading-snug">{t('consent.privacyLabel')}</span>
            </label>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            className="w-full"
            disabled={!canAccept}
            onClick={() => void onAccept()}
          >
            {isAccepting ? t('consent.accepting') : t('consent.accept')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
