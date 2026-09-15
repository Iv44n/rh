import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BadgeCheckIcon,
  CheckIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  Loader2Icon,
  SparklesIcon
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '#/features/auth/store/auth'
import { OrgPageHeader } from '#/features/organization/components/org-page-header'
import { useOrganizations } from '#/features/organization/hooks/use-organizations'
import type { Plan, PlanPrice } from '#/sdk/modules/billing/types'
import { Button } from '#/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '#/shared/components/ui/card'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { useCheckout } from '../hooks/use-checkout'
import { useCustomerPortal } from '../hooks/use-customer-portal'
import {
  organizationSubscriptionQueryKey,
  useOrganizationSubscription
} from '../hooks/use-organization-subscription'
import { usePlans } from '../hooks/use-plans'

const routeApi = getRouteApi('/_protected/organization/billing')

const STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  trialing: 'En prueba',
  past_due: 'Pago vencido',
  canceled: 'Cancelada',
  unpaid: 'Sin pagar',
  incomplete: 'Incompleta'
}

const INTERVAL_LABELS: Record<string, string> = {
  day: 'día',
  week: 'semana',
  month: 'mes',
  year: 'año'
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('es', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function formatPrice(price: PlanPrice | undefined): string {
  if (!price) return ''
  if (price.amountType === 'free' || price.amount === 0) return 'Gratis'
  if (price.amount == null) return 'Personalizado'

  // Polar expresa los importes en la unidad mínima de la moneda (centavos).
  const formatted = new Intl.NumberFormat('es', {
    style: 'currency',
    currency: (price.currency ?? 'usd').toUpperCase()
  }).format(price.amount / 100)

  const interval = price.recurringInterval
    ? (INTERVAL_LABELS[price.recurringInterval] ?? price.recurringInterval)
    : null

  return interval ? `${formatted}/${interval}` : formatted
}

function BenefitList({ plan }: { plan: Plan }) {
  if (plan.benefits.length === 0) return null

  return (
    <ul className="space-y-2 text-sm">
      {plan.benefits.map(benefit => (
        <li key={benefit.id} className="flex items-start gap-2">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <span>{benefit.description}</span>
        </li>
      ))}
    </ul>
  )
}

export default function OrganizationBillingPage() {
  const { checkout_id } = routeApi.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)

  const activeOrganizationId = useAuth(
    state => state.auth?.session.activeOrganizationId
  )
  const { data: organizations = [] } = useOrganizations()
  const organization = organizations.find(
    item => item.id === activeOrganizationId
  )

  const {
    subscription,
    isActive,
    isLoading: isSubscriptionLoading
  } = useOrganizationSubscription(activeOrganizationId)
  const { data: plans = [], isLoading: arePlansLoading } = usePlans()

  const { checkout, isPending: isCheckoutPending } = useCheckout()
  const { openPortal, isPending: isPortalPending } = useCustomerPortal()

  // Al volver del checkout de Polar, confirma y refresca el estado del plan.
  useEffect(() => {
    if (!checkout_id) return

    toast.success('¡Pago completado!', {
      description: 'Tu suscripción se activará en unos instantes.'
    })

    queryClient.invalidateQueries({
      queryKey: organizationSubscriptionQueryKey(activeOrganizationId)
    })

    navigate({
      to: '/organization/billing',
      search: { checkout_id: undefined },
      replace: true
    })
  }, [checkout_id, activeOrganizationId, navigate, queryClient])

  const handleSubscribe = (planId: string) => {
    if (!activeOrganizationId) return
    setPendingPlanId(planId)
    checkout({ organizationId: activeOrganizationId, productId: planId })
  }

  const isLoading = isSubscriptionLoading || arePlansLoading

  // Plan al que pertenece la suscripción activa (para mostrar sus beneficios).
  const activePlan =
    subscription && isActive
      ? (plans.find(plan => plan.id === subscription.productId) ?? null)
      : null

  const periodEnd = subscription
    ? formatDate(subscription.currentPeriodEnd)
    : null
  const price = subscription ? formatPrice(activePlan?.prices[0]) : ''
  const statusLabel = subscription
    ? (STATUS_LABELS[subscription.status] ?? subscription.status)
    : null

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <OrgPageHeader
        icon={<CreditCardIcon />}
        title="Facturación"
        description={
          organization
            ? `Gestiona el plan de "${organization.name}".`
            : 'Gestiona el plan de tu organización.'
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : isActive && subscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 [&_svg]:size-5">
                <BadgeCheckIcon />
              </div>
              <div className="space-y-1">
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {activePlan?.name ?? 'Plan de organización'}
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    {statusLabel}
                  </span>
                </CardTitle>
                <CardDescription>
                  {price ? `${price} · ` : ''}
                  {subscription.cancelAtPeriodEnd && periodEnd
                    ? `Tu plan sigue activo hasta el ${periodEnd}.`
                    : periodEnd
                      ? `Se renueva el ${periodEnd}.`
                      : 'Suscripción activa.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {activePlan &&
          (activePlan.description || activePlan.benefits.length > 0) ? (
            <CardContent className="space-y-4">
              {activePlan.description ? (
                <p className="text-sm text-muted-foreground">
                  {activePlan.description}
                </p>
              ) : null}
              {activePlan.benefits.length > 0 ? (
                <div>
                  <p className="mb-3 text-sm font-medium">Incluye</p>
                  <BenefitList plan={activePlan} />
                </div>
              ) : null}
            </CardContent>
          ) : null}
          <CardContent className="flex flex-wrap items-center gap-3 border-t pt-6">
            <Button
              className="rounded-md"
              onClick={() => openPortal()}
              disabled={isPortalPending}
            >
              {isPortalPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <ExternalLinkIcon />
              )}
              Gestionar suscripción
            </Button>
            <p className="text-xs text-muted-foreground">
              Cambia de plan, actualiza el pago o cancela desde el portal. Al
              cancelar conservas el acceso hasta el fin del período pagado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {!isActive ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SparklesIcon className="size-4" />
              <span>
                Elige un plan para esta organización y desbloquea sus
                beneficios.
              </span>
            </div>
          ) : null}

          {plans.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No hay planes disponibles</CardTitle>
                <CardDescription>
                  Crea un producto recurrente en el dashboard de Polar y
                  aparecerá aquí automáticamente.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {plans.map(plan => (
                <Card key={plan.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-lg font-semibold text-foreground">
                        {formatPrice(plan.prices[0])}
                      </span>
                      {plan.description ? (
                        <span className="mt-1 block">{plan.description}</span>
                      ) : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <BenefitList plan={plan} />
                  </CardContent>
                  <CardContent className="border-t pt-6">
                    <Button
                      className="w-full rounded-md"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isCheckoutPending || !activeOrganizationId}
                    >
                      {isCheckoutPending && pendingPlanId === plan.id ? (
                        <Loader2Icon className="animate-spin" />
                      ) : (
                        <CreditCardIcon />
                      )}
                      Suscribirse
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
