import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuth } from '#/features/auth/store/auth'
import { AppSidebar } from '#/features/dashboard/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '#/shared/components/ui/sidebar'

export const Route = createFileRoute('/_protected')({
  ssr: false,
  beforeLoad: () => {
    const auth = useAuth.getState().auth

    if (!auth?.session) {
      throw redirect({
        to: '/auth/login',
        replace: true
      })
    }
  },
  component: ProtectedLayout
})

function ProtectedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full flex-1 bg-background text-foreground">
        <SidebarTrigger />
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  )
}
