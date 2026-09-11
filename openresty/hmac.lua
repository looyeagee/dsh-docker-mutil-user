local sha256 = require 'resty.sha256'
local bit = require 'bit'

local _M = {}

local BLOCK = 64

local function sha256_bin(data)
  local hasher = sha256:new()
  hasher:update(data)
  return hasher:final()
end

--- HMAC-SHA256 over a string key and message.
function _M.sha256(key, message)
  if #key > BLOCK then
    key = sha256_bin(key)
  end
  if #key < BLOCK then
    key = key .. string.rep('\0', BLOCK - #key)
  end
  local opad = {}
  local ipad = {}
  for i = 1, BLOCK do
    local b = string.byte(key, i)
    opad[i] = string.char(bit.bxor(b, 0x5c))
    ipad[i] = string.char(bit.bxor(b, 0x36))
  end
  return sha256_bin(table.concat(opad) .. sha256_bin(table.concat(ipad) .. message))
end

function _M.to_base64url(bin)
  local b64 = ngx.encode_base64(bin)
  return (b64:gsub('+', '-'):gsub('/', '_'):gsub('=', ''))
end

function _M.from_base64url(text)
  local b64 = text:gsub('-', '+'):gsub('_', '/')
  local pad = #b64 % 4
  if pad > 0 then
    b64 = b64 .. string.rep('=', 4 - pad)
  end
  return ngx.decode_base64(b64)
end

function _M.timing_equal(a, b)
  if type(a) ~= 'string' or type(b) ~= 'string' or #a ~= #b then
    return false
  end
  local diff = 0
  for i = 1, #a do
    diff = bit.bor(diff, bit.bxor(string.byte(a, i), string.byte(b, i)))
  end
  return diff == 0
end

return _M
