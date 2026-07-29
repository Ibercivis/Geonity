import { api } from '@/lib/axios'
import type { AuthResponse, LoginCredentials, RegisterCredentials, User, UserProfile } from '@/types'

export const authApi = {
  login: (data: LoginCredentials) =>
    api.post<AuthResponse>('/users/authentication/login/', data).then((r) => r.data),

  register: (data: RegisterCredentials) =>
    api.post('/users/registration/', data).then((r) => r.data),

  getUser: () =>
    api.get<User>('/users/authentication/user/').then((r) => r.data),

  getProfile: () =>
    api.get<UserProfile>('/users/profile/').then((r) => r.data),

  updateProfile: (data: FormData) =>
    api.patch<UserProfile>('/users/profile/', data).then((r) => r.data),

  deleteAccount: (keepObservations: boolean) =>
    api.delete('/users/delete/', { data: { keep_observations: keepObservations } }),

  recordConsent: (termsVersion: string, privacyVersion: string) =>
    api.post<User>('/users/consent/', { terms_version: termsVersion, privacy_version: privacyVersion }).then((r) => r.data),

  // Google OAuth – token exchange (access_token obtained externally)
  loginWithGoogle: (accessToken: string) =>
    api
      .post<AuthResponse>('/users/auth/google/', { access_token: accessToken })
      .then((r) => r.data),
}
