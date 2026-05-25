import { Injectable, type NestMiddleware } from '@nestjs/common'
import { toNodeHandler } from 'better-auth/node'
import type { NextFunction, Request, Response } from 'express'
import { auth } from './config'

@Injectable()
export class BetterAuthMiddleware implements NestMiddleware {
  private readonly authHandler = toNodeHandler(auth)

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      await this.authHandler(req, res)

      if (res.headersSent) {
        return
      }

      next()
    } catch (e) {
      next(e)
    }
  }
}
