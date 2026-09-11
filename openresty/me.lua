local cjson = require 'cjson.safe'

local uid = ngx.ctx.gw_uid
if type(uid) ~= 'string' then
  ngx.status = 401
  ngx.header['Content-Type'] = 'application/json; charset=utf-8'
  ngx.say('{"error":"unauthorized"}')
  return
end

ngx.header['Content-Type'] = 'application/json; charset=utf-8'
ngx.header['Cache-Control'] = 'no-store'
ngx.say(cjson.encode({ username = uid }))
