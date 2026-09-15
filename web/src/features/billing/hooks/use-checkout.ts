import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '#/sdk'

/**
 * Inicia el checkout de un plan concreto en Polar y redirige a la pasarela de
 * pago. El plan se identifica por su `productId` (los planes se listan de forma
 * dinámica) y la compra se ata a la organización mediante `referenceId`.
 */
export function useCheckout() {
  const mutation = useMutation({
    mutationFn: async (input: {
      organizationId: string
      productId: string
    }) => {
      const { url } = await api.billing.checkout({
        products: [input.productId],
        referenceId: input.organizationId
      })

      return url
    },
    onSuccess: url => {
      window.location.href = url
    },
    onError: (err: Error) => {
      toast.error('No se pudo iniciar el pago', {
        description: err.message || 'Inténtalo de nuevo.'
      })
    }
  })

  return {
    checkout: mutation.mutate,
    isPending: mutation.isPending
  }
}
