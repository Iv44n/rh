import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '#/sdk'

export const plansQueryKey = ['billing-plans'] as const

/**
 * Catálogo de planes de suscripción. La fuente de verdad es Polar: añadir un
 * plan en el dashboard lo hace aparecer aquí sin tocar código. `staleTime` alto
 * porque el catálogo cambia con poca frecuencia.
 */
export const plansQueryOptions = queryOptions({
  queryKey: plansQueryKey,
  queryFn: () => api.billing.listPlans(),
  staleTime: 5 * 60 * 1000
})

export function usePlans() {
  return useQuery(plansQueryOptions)
}
