export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  mediaUrl: import.meta.env.VITE_MEDIA_URL as string,
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN as string,
  observationsApiKey: import.meta.env.VITE_OBSERVATIONS_API_KEY as string,
  ibercivisAccountIssuer: import.meta.env.VITE_IBERCIVIS_ACCOUNT_ISSUER as string | undefined,
  ibercivisAccountClientId: import.meta.env.VITE_IBERCIVIS_ACCOUNT_CLIENT_ID as string | undefined,
}
