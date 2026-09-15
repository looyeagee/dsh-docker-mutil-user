FROM node:24-bookworm-slim

# apt 走 HTTP 清华源，避开本机 Clash Fake-IP 的 HTTPS 证书校验失败
# 可 --build-arg DEBIAN_MIRROR=http://mirrors.ustc.edu.cn
ARG DEBIAN_MIRROR=http://mirrors.tuna.tsinghua.edu.cn
RUN set -eux; \
    for f in /etc/apt/sources.list /etc/apt/sources.list.d/debian.sources; do \
      [ -f "$f" ] || continue; \
      sed -i \
        -e "s#https\\?://deb.debian.org#${DEBIAN_MIRROR}#g" \
        -e "s#https\\?://security.debian.org#${DEBIAN_MIRROR}#g" \
        "$f"; \
    done \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        wget \
        bash \
        git \
        build-essential \
        cmake \
        python3 \
        python3-pip \
        musl-tools \
        iputils-ping \
        iproute2 \
        bind9-dnsutils \
        netcat-openbsd \
        procps \
        psmisc \
        lsof \
        jq \
        unzip \
        zip \
        file \
        tree \
        less \
        vim \
        rsync \
        openssh-client \
    && rm -rf /var/lib/apt/lists/*

# 容器内挂载仓库时常触发 dubious ownership，信任所有目录
RUN git config --global --add safe.directory '*'

# npm 换源；用 Corepack 启用项目锁定的 pnpm@11.7.0（勿装最新的 pnpm 12）
RUN npm config set registry https://registry.npmmirror.com \
    && corepack enable \
    && corepack prepare pnpm@11.7.0 --activate \
    && pnpm config set registry https://registry.npmmirror.com

WORKDIR /workspace

CMD ["bash"]
