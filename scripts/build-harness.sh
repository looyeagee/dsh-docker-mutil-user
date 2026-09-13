#!/usr/bin/env bash
# 复用 Dockerfile 打出的 docker-dsh:v1，起一个 --rm 临时容器，
# 对 HARNESS_PATH（默认 ../deepseek-harness）执行 pnpm install && pnpm run build。
# 用户容器跑 Linux，本机 macOS 编出来的 native addon 不能用。
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
image=${DSH_IMAGE:-docker-dsh:v1}

usage() {
  cat <<EOF
Usage: $(basename "$0") [--] [command...]

无参数时：确保镜像 $image 存在，挂载 HARNESS_PATH，执行
  pnpm install && pnpm run build
结束后容器删除。pnpm store 缓存在 named volume dsh-pnpm-store。

有参数时：同一镜像与挂载，改跑给定命令（例如 bash）。

环境变量：
  HARNESS_PATH   harness 仓库路径（默认读 .env，再退回 ../deepseek-harness）
  DSH_IMAGE      镜像名（默认 docker-dsh:v1，与 docker-compose.users.yml 一致）
EOF
}

if [[ ${1:-} == -h || ${1:-} == --help ]]; then
  usage
  exit 0
fi
if [[ ${1:-} == -- ]]; then
  shift
fi

harness_path=${HARNESS_PATH:-}
if [[ -z $harness_path && -f $root/.env ]]; then
  harness_path=$(sed -nE 's/^[[:space:]]*HARNESS_PATH=//p' "$root/.env" | tail -n 1)
  harness_path=${harness_path%$'\r'}
fi
harness_path=${harness_path:-../deepseek-harness}

if [[ $harness_path != /* ]]; then
  harness_path=$(cd "$root/$harness_path" && pwd)
else
  harness_path=$(cd "$harness_path" && pwd)
fi

if [[ ! -f $harness_path/package.json ]]; then
  echo "not a harness checkout: $harness_path" >&2
  exit 1
fi

echo "image   $image"
echo "harness $harness_path"
docker build -t "$image" "$root"

run_flags=(--rm --init)
if [[ -t 0 && -t 1 ]]; then
  run_flags+=(-it)
fi

if [[ $# -eq 0 ]]; then
  set -- bash -lc 'pnpm install && pnpm run build'
fi

exec docker run "${run_flags[@]}" \
  --name "dsh-harness-build-$$" \
  -v "$harness_path:/app" \
  -v dsh-pnpm-store:/root/.local/share/pnpm/store \
  -w /app \
  "$image" \
  "$@"
