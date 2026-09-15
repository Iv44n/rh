import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '#/sdk'
import type { Subscription } from '#/sdk/modules/billing/types'

/**
 * Estados de suscripción que conceden acceso al plan.
 */
const ACTIVE_STATUSES = new Set<Subscription['status']>(['active', 'trialing'])

export const organizationSubscriptionQueryKey = (
  organizationId?: string | null
) => ['organization-subscription', organizationId ?? 'none'] as const

export const organizationSubscriptionQueryOptions = (
  organizationId?: string | null
) =>
  queryOptions({
    queryKey: organizationSubscriptionQueryKey(organizationId),
    queryFn: () =>
      organizationId
        ? api.billing.listSubscriptions({
            referenceId: organizationId,
            active: true
          })
        : Promise.resolve<Subscription[]>([])
  })

/**
 * Suscripción de la organización (atada por `referenceId` = organizationId).
 * Devuelve la suscripción activa y un flag `isActive` para decidir el acceso.
 */
export function useOrganizationSubscription(organizationId?: string | null) {
  const query = useQuery({
    ...organizationSubscriptionQueryOptions(organizationId),
    enabled: Boolean(organizationId)
  })

  const subscriptions = query.data ?? []
  const subscription =
    subscriptions.find(item => ACTIVE_STATUSES.has(item.status)) ??
    subscriptions[0] ??
    null
  const isActive = subscriptions.some(item => ACTIVE_STATUSES.has(item.status))

  return { ...query, subscription, isActive }
}
