import type { HttpClient } from '#/sdk/http/http-client'
import { routes } from './routes'
import type {
  CheckoutRequest,
  CheckoutResponse,
  ListSubscriptionsParams,
  ListSubscriptionsResponse,
  Plan,
  PortalResponse,
  Subscription
} from './types'

export function billingClient(http: HttpClient) {
  return {
    /** Catálogo de planes de suscripción disponibles. */
    async listPlans(): Promise<Plan[]> {
      const data = await http.get<Plan[]>(routes.plans)
      return data ?? []
    },
    /**
     * Crea una sesión de checkout en Polar y devuelve la URL de pago.
     * Se fuerza `redirect: false` para recibir JSON (`{ url }`) y que el
     * cliente controle la redirección.
     */
    async checkout(request: CheckoutRequest) {
      return await http.post<
        CheckoutResponse,
        CheckoutRequest & { redirect: boolean }
      >(routes.checkout, {
        body: { ...request, redirect: false }
      })
    },
    /**
     * Devuelve la URL del portal de cliente para gestionar la suscripción de la
     * organización activa. El backend resuelve el Customer de la suscripción de
     * la org (no la del usuario) y autoriza por rol (owner/admin).
     */
    async portal() {
      return await http.post<PortalResponse>(routes.portal)
    },
    /**
     * Lista las suscripciones asociadas a un `referenceId` (la organización).
     * Con `active: true`, Polar filtra solo las activas.
     */
    async listSubscriptions(
      params: ListSubscriptionsParams = {}
    ): Promise<Subscription[]> {
      const query = new URLSearchParams()

      if (params.referenceId) {
        query.set('referenceId', params.referenceId)
      }

      if (params.active !== undefined) {
        query.set('active', String(params.active))
      }
      if (params.page !== undefined) {
        query.set('page', String(params.page))
      }

      if (params.limit !== undefined) {
        query.set('limit', String(params.limit))
      }

      const queryString = query.toString()

      const data = await http.get<ListSubscriptionsResponse>(
        queryString
          ? `${routes.listSubscriptions}?${queryString}`
          : routes.listSubscriptions
      )

      return data?.result?.items ?? []
    }
  }
}
