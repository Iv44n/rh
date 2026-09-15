export const routes = {
  checkout: '/auth/checkout',
  state: '/auth/customer/state',
  listSubscriptions: '/auth/customer/subscriptions/list',
  // Servidos por nuestro módulo NestJS de billing.
  // `portal` resuelve el Customer de la suscripción de la ORG (no la del
  // usuario), para que cualquier owner/admin pueda gestionarla.
  plans: '/billing/plans',
  portal: '/billing/portal'
} as const
