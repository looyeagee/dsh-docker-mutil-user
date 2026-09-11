local cjson = require 'cjson.safe'
local hmac = require 'hmac'
local users = require 'users'

local _M = {
  users = users,
  COOKIE = 'dsh_gw',
  UID_PATTERN = '^[a-z0-9-]+$',
}

function _M.secret()
  return os.getenv('DSH_GW_SECRET') or ''
end

function _M.ttl()
  return tonumber(os.getenv('COOKIE_TTL_SECONDS')) or 43200
end

function _M.sign(uid)
  local now = ngx.time()
  local body = hmac.to_base64url(cjson.encode({
    uid = uid,
    iat = now,
    exp = now + _M.ttl(),
  }))
  return body .. '.' .. hmac.to_base64url(hmac.sha256(_M.secret(), body))
end

function _M.verify(token)
  if type(token) ~= 'string' then
    return nil
  end
  local dot = token:find('.', 1, true)
  if not dot or token:find('.', dot + 1, true) then
    return nil
  end
  local body = token:sub(1, dot - 1)
  local sig = token:sub(dot + 1)
  if body == '' or sig == '' then
    return nil
  end
  local expected = hmac.to_base64url(hmac.sha256(_M.secret(), body))
  if not hmac.timing_equal(sig, expected) then
    return nil
  end
  local payload = cjson.decode(hmac.from_base64url(body) or '')
  if type(payload) ~= 'table' then
    return nil
  end
  local uid = payload.uid
  if type(uid) ~= 'string' or not uid:find(_M.UID_PATTERN) then
    return nil
  end
  if type(payload.exp) ~= 'number' or type(payload.iat) ~= 'number' then
    return nil
  end
  local now = ngx.time()
  if payload.exp <= now or payload.iat > now + 60 then
    return nil
  end
  if type(users[uid]) ~= 'string' then
    return nil
  end
  return uid
end

function _M.set_cookie(token)
  local parts = {
    _M.COOKIE .. '=' .. token,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' .. tostring(_M.ttl()),
  }
  if os.getenv('COOKIE_SECURE') == '1' then
    parts[#parts + 1] = 'Secure'
  end
  return table.concat(parts, '; ')
end

function _M.clear_cookie()
  return _M.COOKIE .. '=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly'
end

return _M
