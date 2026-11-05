# Base image updated by Renovate, update versionCompatibility on Alpine base bump
ARG BUILD_FROM=ghcr.io/home-assistant/base:3.24-2026.10.3@sha256:880016115f356afc814398e17ba68a7ee66dfc1b4eaef09755ea2c9fa18ea481
FROM $BUILD_FROM

# Setup base
RUN \
    set -x \
    && apk add --no-cache \
        bash-completion \
        pulseaudio-utils \
        alsa-plugins-pulse \
        bluez \
        git \
        libuv \
        mosquitto-clients \
        nano \
        openssh \
        pwgen \
        tmux \
        ttyd \
        vim

# Add YAML highlighting for nano
ADD https://raw.githubusercontent.com/scopatz/nanorc/master/yaml.nanorc /usr/share/nano/yaml.nanorc
RUN sed -i 's/^#[[:space:]]*\(include "\/usr\/share\/nano\/\*\.nanorc".*\)/\1/' /etc/nanorc

# Use bash as default shell
RUN sed -i "s|/bin/sh|/bin/bash|" /etc/passwd

# Home Assistant CLI
ARG CLI_VERSION=5.6.0
ARG TARGETARCH
RUN \
    if [ -z "${TARGETARCH}" ]; then \
        echo "TARGETARCH is not set, please use Docker BuildKit for the build." && exit 1; \
    fi \
    && case "${TARGETARCH}" in \
            amd64) CLI_ARCH="amd64" ;; \
            arm64) CLI_ARCH="aarch64" ;; \
            *) echo "Unsupported TARGETARCH: ${TARGETARCH}" && exit 1 ;; \
        esac \
    && curl -Lso /usr/bin/ha \
        "https://github.com/home-assistant/cli/releases/download/${CLI_VERSION}/ha_${CLI_ARCH}" \
    && chmod a+x /usr/bin/ha \
    && /usr/bin/ha completion > /usr/share/bash-completion/completions/ha

# Copy data
COPY rootfs /

LABEL \
    org.opencontainers.image.title="Home Assistant App: Terminal & SSH" \
    org.opencontainers.image.description="Allow logging in remotely to Home Assistant using SSH" \
    org.opencontainers.image.source="https://github.com/home-assistant/app-ssh" \
    org.opencontainers.image.licenses="Apache License 2.0"
