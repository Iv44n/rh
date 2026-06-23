import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useOrganization } from '#/features/organization/store/organization'
import { api } from '#/sdk'
import { useAuth } from '../store/auth'

export const useSignUpEmail = () => {
  const refreshAuth = useAuth(state => state.refreshAuth)
  const clearOrganizations = useOrganization(state => state.clearOrganizations)
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: api.auth.signUp.email,
    onSuccess: async () => {
      clearOrganizations()
      await refreshAuth()
      await router.invalidate({ sync: true })

      toast.success('Cuenta creada exitosamente', {
        description: 'Se creó la cuenta exitosamente'
      })
    },
    onError: (err: Error) => {
      toast.error('Error al registrar cuenta', {
        description: err.message || 'No se pudo registrar la cuenta'
      })
    }
  })

  return {
    signUp: mutation.mutate,
    isPending: mutation.isPending
  }
}
