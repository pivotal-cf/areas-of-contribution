#!/bin/bash

set -euo pipefail

cd $(dirname $0)

go build -o bin/md-generator ./md-generator/main.go

bin/md-generator -in ../yaml -out ../

echo "success"
