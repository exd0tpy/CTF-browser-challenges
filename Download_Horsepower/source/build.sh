#!/bin/bash
# Heavily based on Fuzzilli's Docker support
set -e

cd $(dirname $0)
CTF_ROOT=.

# Setup build context
REV=$(cat $CTF_ROOT/REVISION)

# Fetch the source code, apply patches, and compile the engine
docker build --build-arg rev=$REV -t v8_builder .

# Copy build products
mkdir -p out
docker create --name temp_container v8_builder
docker cp temp_container:/home/builder/v8/v8/out/download_horsepower/d8 out/d8
docker rm temp_container
