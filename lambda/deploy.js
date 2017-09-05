"use strict";
let fs = require('fs');
let riffraff = require('node-riffraff-artefact');

try {
	fs.statSync('tmp');
} catch (ex) {
	fs.mkdirSync('tmp');
}

fs.writeFileSync('tmp/deploy-info.json', JSON.stringify(riffraff.buildManifest()));

riffraff.determineAction();
