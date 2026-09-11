local gw = require 'gw'

ngx.header['Set-Cookie'] = gw.clear_cookie()
ngx.redirect('/login', 302)
