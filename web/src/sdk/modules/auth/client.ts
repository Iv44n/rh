import type { HttpClient } from '#/sdk/http/http-client'
import { routes } from './routes'
import type {
  AuthResponse,
  Session,
  SignInEmailRequest,
  SignUpEmailRequest,
  User
} from './types'

export function authClient(http: HttpClient) {
  return {
    async getSession() {
      const data = await http.get<{ user: User; session: Session } | null>(
        routes.getSession
      )
      return data ?? null
    },
    signIn: {
      async email(request: SignInEmailRequest) {
        return await http.post<AuthResponse, SignInEmailRequest>(
          routes.signInEmail,
          {
            body: request
          }
        )
      }
    },
    signUp: {
      async email(request: SignUpEmailRequest) {
        return await http.post<AuthResponse, SignUpEmailRequest>(
          routes.signUpEmail,
          {
            body: request
          }
        )
      }
    },
    async signOut() {
      return await http.post<{ success: boolean }>(routes.signOutEmail)
    }
  }
}
