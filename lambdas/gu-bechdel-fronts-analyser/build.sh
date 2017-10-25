#!/usr/bin/env bash

NODE_VERSION="6.2.1"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm

nvm use ${NODE_VERSION}

npm install
npm run riffraff-artefact
