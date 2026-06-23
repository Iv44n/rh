import { Injectable, type NestMiddleware } from '@nestjs/common'
import { fromNodeHeaders } from 'better-auth/node'
import type { NextFunction, Request, Response } from 'express'
import { auth } from './config'

/**
 * Restringe el listado de invitaciones (`GET /api/auth/organization/list-invitations`)
 * a quienes pueden gestionarlas (owner/admin), ya que better-auth permite por
 * defecto que cualquier miembro las liste. Se reutiliza el permiso nativo
 * `invitation:create` (que solo tienen owner/admin) como criterio, en lugar de
 * mantener una tabla de roles propia.
 *
 * Se ejecuta antes que `BetterAuthMiddleware`: si el rol no tiene permiso,
 * responde 403; en cualquier otro caso delega en better-auth (que ya valida
 * sesión y organización activa). La comprobación usa la organización activa de
 * la sesión, que es la que consulta la UI de invitaciones.
 */
@Injectable()
export class InvitationListAccessMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await auth.api.hasPermission({
        headers: fromNodeHeaders(req.headers),
        body: { permissions: { invitation: ['create'] } }
      })

      if (result?.success) {
        next()
        return
      }

      res.status(403).json({
        code: 'FORBIDDEN',
        message:
          'No tienes permiso para ver las invitaciones de esta organización.'
      })
    } catch {
      next()
    }
  }
}
