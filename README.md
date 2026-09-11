# docker-dsh 多用户网关

`dsh web` 是单用户进程。这里一个容器一个实例，入口只有 OpenResty：Lua 登录后下发 `dsh_gw` Cookie，再按 uid 反代到对应工作容器。

## 安全边界

- 隔离单元是 **容器 + 独立 `$DSH_HOME` / workspace**。
- 工作容器挂了 `openresty-proxy-auth`：谁能连上该容器 3080，谁就拥有完整 Host API。**默认不 publish 3080。**
- 账号密码明文写在 `openresty/users.lua`，进程启动时 `require` 进内存；改完后 `docker compose exec openresty openresty -s reload`。
- 网关 Cookie 是唯一闸门。对公网必须 TLS，并把 `COOKIE_SECURE=1`。

## 启动

```sh
cp .env.example .env
docker compose up --build
```

演示账号：`alice` / `bob`，密码都是 `changeme`。

## 增加用户

在 `openresty/users.lua` 加一行：

```lua
return {
  alice = 'changeme',
  bob = 'changeme',
  carol = 'plain-password',
}
```

然后：

```sh
bash scripts/render-compose.sh
docker compose up --build -d
```

## 布局

```
openresty/users.lua           明文账号，加载进内存
openresty/*.lua               登录、验 Cookie、选上游
users/<id>/                   每用户 DSH home 与 workspace
scripts/render-compose.sh     从 users.lua 生成 compose
docker-compose.users.yml      生成文件，不要手改
```
