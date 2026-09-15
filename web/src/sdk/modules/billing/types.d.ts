export type CheckoutRequest = {
  /** Product ID(s) de Polar. Alternativo a `slug`. */
  products?: string[] | string
  /** Slug del producto configurado en el servidor (p. ej. `organization`). */
  slug?: string
  /**
   * Asocia la compra a una entidad (la organización). Se guarda como
   * `metadata.referenceId` en el checkout, la orden y la suscripción.
   */
  referenceId?: string
  successUrl?: string
}

export type CheckoutResponse = {
  url: string
  redirect: boolean
}

export type PortalResponse = {
  url: string
}

export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | (string & {})

export type Subscription = {
  id: string
  status: SubscriptionStatus
  amount: number | null
  currency: string | null
  recurringInterval: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  startedAt: string | null
  endsAt: string | null
  productId: string
  product?: {
    id: string
    name: string
  }
  metadata?: Record<string, unknown>
}

export type ListSubscriptionsParams = {
  referenceId?: string
  active?: boolean
  page?: number
  limit?: number
}

export type PlanPrice = {
  amountType: string
  /** Importe en la unidad mínima de la moneda (centavos). `null` si no aplica. */
  amount: number | null
  currency: string | null
  recurringInterval: string | null
}

export type PlanBenefit = {
  id: string
  type: string
  description: string
}

/** Plan de suscripción (producto de Polar) con sus precios y beneficios. */
export type Plan = {
  id: string
  name: string
  description: string | null
  recurringInterval: string | null
  prices: PlanPrice[]
  benefits: PlanBenefit[]
}

/**
 * Respuesta paginada del SDK de Polar tal y como la reenvía better-auth.
 */
export type ListSubscriptionsResponse = {
  result: {
    items: Subscription[]
    pagination: {
      totalCount: number
      maxPage: number
    }
  }
}
