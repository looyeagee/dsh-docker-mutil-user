# docker-dsh 多用户网关

`dsh web` 是单用户进程。这里一个容器一个实例，入口只有 OpenResty：Lua 登录后下发 `dsh_gw` Cookie，再按 uid 反代到对应工作容器。

## 安全边界

- 隔离单元是 **容器 + 独立 `$DSH_HOME` / workspace**。
- 工作容器挂了 `openresty-proxy-auth`：谁能连上该容器 3080，谁就拥有完整 Host API。**默认不 publish 3080。**
- 账号密码明文写在 `openresty/users.lua`，进程启动时 `require` 进内存；改完后 `docker compose exec openresty openresty -s reload`。
- 网关 Cookie 是唯一闸门。对公网必须 TLS，并把 `COOKIE_SECURE=1`。
- 浏览器拉 `/manifest.webmanifest` 不带 Cookie（`<link rel=manifest>` 默认 credentials omit），这条 GET/HEAD 免登录，反代到一个已配置用户容器。
- 登录后访问 `/workspace/` 是该用户工作区的 nginx 目录索引，可浏览和下载文件；只映射 `users/<uid>/workspace`，不开放 `dsh_home`。

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

`overlays/suppress-welcome.cordis.yml` 用更低 priority 盖住 shipped 的 `welcome-notice` 步骤，新建空白会话时不再弹出「内测声明」。

`overlays/hide-settings-sections.cordis.yml` 从设置弹框导航里拿掉「模型」「插件」「Agent 预设」，只留「通用」。

`overlays/default-workspace.cordis.yml` 在启动时把容器内的 `/workspace` 登记为 DSH 工作区；同一路径重复登记会复用已有记录。侧栏会自动选中它（没有当前会话时）。

`overlays/default-flat-list.cordis.yml` 在浏览器还没有分组偏好时，把侧栏「分组方式」写成「单列表」。已经选过的浏览器会保持上次选择。

`overlays/slash-skill-first.cordis.yml` 把输入框 `/` 菜单里的「技能」组排到「添加」「指令」前面。

登录后打开 `/workspace/` 可浏览并下载当前用户工作区里的文件（nginx `autoindex`，仍要网关 Cookie）。

`overlays/workspace-html-preview.cordis.yml` 让侧栏预览 `/workspace/` 下的 HTML 时，iframe 直接打开网关上的同一路径，这样同目录图片等相对资源能加载；不再只用 blob。

## 布局

```
openresty/users.lua           明文账号，加载进内存
openresty/*.lua               登录、验 Cookie、选上游、/me
overlays/lan-bind.cordis.yml          容器内监听 0.0.0.0，并关掉 cookie / Host 校验
overlays/openresty-proxy-auth.mjs     lan-bind 插入的 Connection 插件
overlays/shared-mcp.yml               所有用户共用的 MCP overlay
overlays/whoami.cordis.yml            侧栏显示网关登录名
overlays/suppress-welcome.cordis.yml  屏蔽「内测声明」onboarding
overlays/hide-settings-sections.cordis.yml  设置弹框去掉模型 / 插件 / Agent 预设
overlays/default-workspace.cordis.yml     默认登记 /workspace 为工作区
overlays/default-flat-list.cordis.yml     分组方式默认「单列表」
overlays/slash-skill-first.cordis.yml     `/` 菜单里技能组排第一
overlays/workspace-html-preview.cordis.yml  侧栏 HTML 走 `/workspace/` 网关路径
users/<id>/                   每用户 DSH home 与 workspace
scripts/render-compose.sh     从 users.lua 生成 compose
docker-compose.users.yml      生成文件，不要手改
```
