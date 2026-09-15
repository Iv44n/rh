import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuth } from '#/features/auth/store/auth'
import OrganizationBillingPage from '#/features/billing/pages/organization-billing'
import { activeMemberRoleQueryOptions } from '#/features/organization/hooks/use-active-member-role'
import { can } from '#/features/organization/utils/permissions'

export const Route = createFileRoute('/_protected/organization/billing')({
  // `checkout_id` lo añade Polar al redirigir tras un pago correcto.
  validateSearch: (search: Record<string, unknown>) => ({
    checkout_id:
      typeof search.checkout_id === 'string' ? search.checkout_id : undefined
  }),
  // Gestionar la facturación requiere `billing:manage` (owner/admin).
  beforeLoad: async ({ context }) => {
    const activeOrganizationId =
      useAuth.getState().auth?.session.activeOrganizationId

    const { role } = await context.queryClient.ensureQueryData(
      activeMemberRoleQueryOptions(activeOrganizationId)
    )

    if (!can(role, 'billing:manage')) {
      throw redirect({ to: '/dashboard', replace: true })
    }
  },
  component: OrganizationBillingPage
})
