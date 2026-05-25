export type User = {
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: string
  updatedAt: string
  id: string
}

export type Session = {
  id: string
  token: string
  userId: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

export type SignInEmailRequest = {
  email: string
  password: string
}

export type SignUpEmailRequest = {
  name: string
  email: string
  password: string
}

export type AuthResponse = {
  redirect?: boolean
  token?: string | null
  url?: string | null
  user: User
}
