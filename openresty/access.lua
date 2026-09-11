local gw = require 'gw'

local function reject()
  local accept = ngx.var.http_accept or ''
  local html_nav = ngx.var.request_method == 'GET' and accept:find('text/html', 1, true)
  if html_nav then
    return ngx.redirect('/login', 302)
  end
  ngx.status = 401
  ngx.header['Content-Type'] = 'text/plain; charset=utf-8'
  ngx.say('unauthorized')
  return ngx.exit(401)
end

if gw.secret() == '' then
  ngx.log(ngx.ERR, 'dsh-gw: DSH_GW_SECRET is missing')
  ngx.status = 500
  ngx.say('gateway misconfigured')
  return ngx.exit(500)
end

local uid = gw.verify(ngx.var['cookie_' .. gw.COOKIE])
-- <link rel=manifest> is fetched without cookies (credentials omitted).
local method = ngx.var.request_method
if not uid
  and ngx.var.uri == '/manifest.webmanifest'
  and (method == 'GET' or method == 'HEAD')
then
  uid = gw.default_uid()
end
if not uid then
  return reject()
end

ngx.ctx.gw_uid = uid
ngx.var.gw_uid = uid
ngx.var.dsh_upstream = 'dsh-' .. uid .. ':3080'
