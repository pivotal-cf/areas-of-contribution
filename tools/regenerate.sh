#!/bin/bash

set -euo pipefail

cd $(dirname $0)

go build -o bin/md-generator ./md-generator/main.go

for skillArea in ../yaml/*.yaml; do
  bin/md-generator $skillArea > ../$(basename $skillArea .yaml).md
done

echo "success"
