import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '#/sdk'

/**
 * Abre el portal de cliente de Polar, donde el usuario puede gestionar su
 * suscripción (cambiar de plan, actualizar el método de pago, cancelar, etc.).
 */
export function useCustomerPortal() {
  const mutation = useMutation({
    mutationFn: async () => {
      const { url } = await api.billing.portal()

      return url
    },
    onSuccess: url => {
      window.location.href = url
    },
    onError: (err: Error) => {
      toast.error('No se pudo abrir el portal de facturación', {
        description: err.message || 'Inténtalo de nuevo.'
      })
    }
  })

  return {
    openPortal: mutation.mutate,
    isPending: mutation.isPending
  }
}
