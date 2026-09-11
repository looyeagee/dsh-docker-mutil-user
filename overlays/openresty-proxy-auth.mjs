/**
 * Skip the process-token cookie so the OpenResty gateway can be the only login.
 * Also skips Host/Origin (otherwise a proxied public hostname gets 403).
 * Do not publish this port past the proxy.
 */
export const name = 'openresty-proxy-auth'
export const inject = ['connection']

export function apply(ctx) {
  ctx.connection.authorizeIndex = () => true
  ctx.connection.requestRejection = () => undefined
  console.warn(
    'openresty-proxy-auth: browser cookie and Host/Origin checks are off; anyone who can reach this port has the Host API',
  )
}
