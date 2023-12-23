#!/bin/bash
set -e

echo "node version is " && node -v

source /etc/profile

npm i -g pnpm --registry=https://bnpm.byted.org


pnpm install --registry=https://bnpm.byted.org

pnpm run build