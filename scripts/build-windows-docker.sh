#!/bin/bash
# Initial Author: Bryan Gmyrek <bryangmyrekcom@gmail.com>
# Build project for windows in docker
# Run from project root like scripts/build-windows-docker.sh

set -evx

# Ensure we are in the root directory of the project
ls package.json

# Prep the electron-builder:wine docker and the build process
docker run --rm -ti -v ${PWD}:/project \
 -v ${PWD##*/}-node-modules:/project/node_modules \
 -v ~/.electron:/root/.electron \
 electronuserland/electron-builder:wine \
 /bin/bash -c "npm install && npm prune && npm run distwin"
