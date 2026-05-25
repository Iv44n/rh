import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { FormInput } from '#/shared/components/base/form-input'
import { Button } from '#/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '#/shared/components/ui/card'
import { FieldGroup } from '#/shared/components/ui/field'
import { useSignInEmail } from '../hooks/use-sign-in-email'
import { loginSchema } from '../schemas/login'

export default function LoginForm() {
  const { signIn, isPending } = useSignInEmail()

  const form = useForm({
    defaultValues: {
      email: '',
      password: ''
    },

    validators: {
      onSubmit: loginSchema
    },

    onSubmit: ({ value }) => signIn(value)
  })

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-md rounded-md">
        <CardHeader>
          <CardTitle className="text-xl">Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={e => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              <form.Field name="email">
                {field => (
                  <FormInput
                    name={field.name}
                    label="Correo electrónico"
                    type="email"
                    onValueChange={field.handleChange}
                    onBlur={field.handleBlur}
                    value={field.state.value}
                    errorMessage={field.state.meta.errors[0]?.message}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                )}
              </form.Field>

              <form.Field name="password">
                {field => (
                  <FormInput
                    type="password"
                    onValueChange={field.handleChange}
                    onBlur={field.handleBlur}
                    value={field.state.value}
                    errorMessage={field.state.meta.errors[0]?.message}
                    name={field.name}
                    label="Contraseña"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                )}
              </form.Field>

              <form.Subscribe
                selector={state => [state.canSubmit, state.isSubmitting]}
              >
                {([_, isSubmitting]) => {
                  const isLoading = isSubmitting || isPending

                  return (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="mt-2 w-full rounded-md transition-none focus-visible:ring-0 disabled:ring-0"
                    >
                      {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </Button>
                  )
                }}
              </form.Subscribe>

              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link
                  to="/auth/register"
                  className="hover:underline font-medium text-foreground"
                >
                  Regístrate
                </Link>
              </p>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
