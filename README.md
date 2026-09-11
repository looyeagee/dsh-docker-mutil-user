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

## 共享 MCP

所有用户容器通过同一份 `--patch` overlay 接入外部 Streamable HTTP MCP，工具名是 `mcp__echo__echo`。MCP 进程不在本仓库启动：先在旁路的 `mcp-echo` 目录 `docker compose up --build -d`，用户容器经 `host.docker.internal:8001` 访问。新增共享 MCP 时改 `overlays/shared-mcp.yml` 并重启对应用户容器。

侧栏左下角「设置」下方显示「登录用户：<uid>」，点击后确认则请求 `GET /logout`。由 `overlays/whoami.cordis.yml` 接到每个用户容器。

## 布局

```
openresty/users.lua           明文账号，加载进内存
openresty/*.lua               登录、验 Cookie、选上游、/me
overlays/shared-mcp.yml       所有用户共用的 MCP overlay
overlays/whoami.cordis.yml    侧栏显示网关登录名
users/<id>/                   每用户 DSH home 与 workspace
scripts/render-compose.sh     从 users.lua 生成 compose
docker-compose.users.yml      生成文件，不要手改
```
