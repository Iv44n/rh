export const HTTP = {
  // 1xx Informational
  CONTINUE: {
    status: 100,
    code: 'CONTINUE',
    message: 'Continúa con la solicitud.'
  },

  SWITCHING_PROTOCOLS: {
    status: 101,
    code: 'SWITCHING_PROTOCOLS',
    message: 'Cambiando protocolo.'
  },

  PROCESSING: {
    status: 102,
    code: 'PROCESSING',
    message: 'Procesando solicitud.'
  },

  // 2xx Success
  OK: {
    status: 200,
    code: 'OK',
    message: 'Operación exitosa.'
  },

  CREATED: {
    status: 201,
    code: 'CREATED',
    message: 'Recurso creado correctamente.'
  },

  ACCEPTED: {
    status: 202,
    code: 'ACCEPTED',
    message: 'Solicitud aceptada.'
  },

  NO_CONTENT: {
    status: 204,
    code: 'NO_CONTENT',
    message: 'Sin contenido.'
  },

  // 3xx Redirection
  MOVED_PERMANENTLY: {
    status: 301,
    code: 'MOVED_PERMANENTLY',
    message: 'Recurso movido permanentemente.'
  },

  FOUND: {
    status: 302,
    code: 'FOUND',
    message: 'Recurso encontrado en otra ubicación.'
  },

  NOT_MODIFIED: {
    status: 304,
    code: 'NOT_MODIFIED',
    message: 'Recurso no modificado.'
  },

  TEMPORARY_REDIRECT: {
    status: 307,
    code: 'TEMPORARY_REDIRECT',
    message: 'Redirección temporal.'
  },

  PERMANENT_REDIRECT: {
    status: 308,
    code: 'PERMANENT_REDIRECT',
    message: 'Redirección permanente.'
  },

  // 4xx Client Errors
  BAD_REQUEST: {
    status: 400,
    code: 'BAD_REQUEST',
    message: 'Solicitud inválida.'
  },

  UNAUTHORIZED: {
    status: 401,
    code: 'UNAUTHORIZED',
    message: 'No autorizado.'
  },

  PAYMENT_REQUIRED: {
    status: 402,
    code: 'PAYMENT_REQUIRED',
    message: 'Pago requerido.'
  },

  FORBIDDEN: {
    status: 403,
    code: 'FORBIDDEN',
    message: 'Acceso denegado.'
  },

  NOT_FOUND: {
    status: 404,
    code: 'NOT_FOUND',
    message: 'Recurso no encontrado.'
  },

  METHOD_NOT_ALLOWED: {
    status: 405,
    code: 'METHOD_NOT_ALLOWED',
    message: 'Método no permitido.'
  },

  NOT_ACCEPTABLE: {
    status: 406,
    code: 'NOT_ACCEPTABLE',
    message: 'Respuesta no aceptable.'
  },

  REQUEST_TIMEOUT: {
    status: 408,
    code: 'REQUEST_TIMEOUT',
    message: 'Tiempo de espera agotado.'
  },

  CONFLICT: {
    status: 409,
    code: 'CONFLICT',
    message: 'Conflicto con el estado actual.'
  },

  GONE: {
    status: 410,
    code: 'GONE',
    message: 'Recurso no disponible.'
  },

  PRECONDITION_FAILED: {
    status: 412,
    code: 'PRECONDITION_FAILED',
    message: 'Precondición fallida.'
  },

  PAYLOAD_TOO_LARGE: {
    status: 413,
    code: 'PAYLOAD_TOO_LARGE',
    message: 'Carga demasiado grande.'
  },

  UNSUPPORTED_MEDIA_TYPE: {
    status: 415,
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'Formato no soportado.'
  },

  UNPROCESSABLE_CONTENT: {
    status: 422,
    code: 'UNPROCESSABLE_CONTENT',
    message: 'Contenido no procesable.'
  },

  LOCKED: {
    status: 423,
    code: 'LOCKED',
    message: 'Recurso bloqueado.'
  },

  TOO_MANY_REQUESTS: {
    status: 429,
    code: 'TOO_MANY_REQUESTS',
    message: 'Demasiadas solicitudes.'
  },

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: {
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Error interno del servidor.'
  },

  NOT_IMPLEMENTED: {
    status: 501,
    code: 'NOT_IMPLEMENTED',
    message: 'Funcionalidad no implementada.'
  },

  BAD_GATEWAY: {
    status: 502,
    code: 'BAD_GATEWAY',
    message: 'Puerta de enlace incorrecta.'
  },

  SERVICE_UNAVAILABLE: {
    status: 503,
    code: 'SERVICE_UNAVAILABLE',
    message: 'Servicio no disponible temporalmente.'
  },

  GATEWAY_TIMEOUT: {
    status: 504,
    code: 'GATEWAY_TIMEOUT',
    message: 'Tiempo de espera del gateway agotado.'
  }
} as const

export type HttpStatus = (typeof HTTP)[keyof typeof HTTP]['status']
export type HttpCode = (typeof HTTP)[keyof typeof HTTP]['code']
export type HttpMessage = (typeof HTTP)[keyof typeof HTTP]['message']
