import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '#/features/auth/store/auth'

export const Route = createFileRoute('/_protected/dashboard')({
  component: RouteComponent
})

function RouteComponent() {
  const user = useAuth(state => state.auth?.user)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <div className="mt-8">
        <p>
          Bienvenido a tu panel de control,{' '}
          {user?.name || user?.email || 'Usuario'}.
        </p>
      </div>
    </div>
  )
}
