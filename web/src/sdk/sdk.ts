import { HttpClient } from './http/http-client'
import { authClient } from './modules/auth/client'
import { organizationClient } from './modules/organization/client'

export function createSDK() {
  const http = HttpClient.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    config: {
      credentials: 'include'
    }
  })

  return {
    auth: authClient(http),
    organization: organizationClient(http)
  }
}

export const api = createSDK()
