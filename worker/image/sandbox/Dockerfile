FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
    time \
    python3 \
    clang \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /sandbox