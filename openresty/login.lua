local gw = require 'gw'

local html
do
  local file = assert(io.open('/usr/local/openresty/nginx/conf/login.html', 'r'))
  html = file:read('*a')
  file:close()
end

local function escape(text)
  text = text or ''
  return (text:gsub('&', '&amp;'):gsub('<', '&lt;'):gsub('>', '&gt;'):gsub('"', '&quot;'))
end

local function page(status, error_text, username)
  local error_html = ''
  if error_text then
    error_html = '<p class="error">' .. escape(error_text) .. '</p>'
  end
  local body = html:gsub('{{error}}', error_html, 1):gsub('{{username}}', escape(username), 1)
  ngx.status = status
  ngx.header['Content-Type'] = 'text/html; charset=utf-8'
  ngx.header['Cache-Control'] = 'no-store'
  ngx.print(body)
end

if ngx.var.request_method == 'GET' then
  page(200)
  return
end

if ngx.var.request_method ~= 'POST' then
  ngx.status = 405
  ngx.say('method not allowed')
  return
end

if gw.secret() == '' then
  ngx.log(ngx.ERR, 'dsh-gw: DSH_GW_SECRET is missing')
  ngx.status = 500
  ngx.say('gateway misconfigured')
  return
end

ngx.req.read_body()
local args = ngx.req.get_post_args() or {}
local username = args.username
local password = args.password
if type(username) ~= 'string' then
  username = ''
end
if type(password) ~= 'string' then
  password = ''
end
username = username:match('^%s*(.-)%s*$') or ''

local expected = gw.users[username]
if type(expected) ~= 'string' or expected ~= password then
  page(401, '用户名或密码错误。', username)
  return
end

ngx.header['Set-Cookie'] = gw.set_cookie(gw.sign(username))
ngx.redirect('/', 302)
