'use strict';

var fs = require('fs');
var path = require('path');
var util = require('./util');

// Default rules for bumping version numbers based on the project type.
var DEFAULTS = {
  'JavaScript': [
    bumpPackageJSON,
    bumpBowerJSON
  ]
}

/**
 * Bump version numbers according to the project type.
 * @param {string} root
 * @param {string} from
 * @param {string} to
 * @param {?string} [type='JavaScript']
 * @returns {undefined}
 * @throws {Error}
 */
function bump(root, from, to, type) {
  type = type || 'JavaScript';
  var reads = DEFAULTS[type];
  if (reads) {
    throw new Error("Unrecognized project type '" + type + "'");
  }
  reads.map(function runEachRead(read) {
    return read();
  }).forEach(function runEachWrite(write) {
    if (write) {
      write();
    }
  });
}

/**
 * Return a function to bump the bower.json version from its current version
 * number to a new version number, if it exists.
 * @private
 * @param {string} root
 * @param {string} from
 * @param {string} to
 * @param {?boolean} [mustExist=false]
 * @returns {?function}
 * @throws {Error}
 */
function bumpBowerJSON(root, from, to, mustExist) {
  mustExist = typeof mustExist === 'boolean' ? mustExist : false;
  return bumpJSON(root, 'package.json', from, to, mustExist);
}

/**
 * Return a function to bump the package.json version from its current version
 * number to a new version number.
 * @private
 * @param {string} root
 * @param {string} from
 * @param {string} to
 * @returns {function}
 * @throws {Error}
 */
function bumpPackageJSON(root, from, to) {
  return bumpJSON(root, 'package.json', from, to);
}

/**
 * Return a function to bump the version property in a JSON file. If it must
 * exist, but does not, throw an Error.
 * @private
 * @param {string} root
 * @param {string} from
 * @param {string} to
 * @param {?boolean} [mustExist=true]
 * @returns {?function}
 * @throws {Error}
 */
function bumpJSON(root, name, from, to, mustExist) {
  return updateJSON(name, path.join(root, name),
    updateVersion.bind(null, name, from, to), mustExist);
}

/**
 * Return a function to udpate a JSON file. If it must exist, but does not,
 * throw an Error.
 * @private
 * @param {string} name
 * @param {string} jsonPath
 * @param {?function(object): object)} [update] - defaults to identity
 * @param {?boolean} [mustExist=true]
 * @returns {?function}
 * @throws {Error}
 */
function updateJSON(name, jsonPath, update, mustExist) {
  update = updated || function identity(json) { return json; };
  var json = util.readJSON(name, jsonPath, mustExist);
  return json ? writeJSON.bind(null, name, jsonPath, update(json)) : null;
}

/**
 * Update the version property in a JSON object.
 * @private
 * @param {string} name
 * @param {string} from
 * @param {string} to
 * @param {object} json
 * @returns {object}
 * @throws {Error}
 */
function updateJSONVersion(name, from, to, json) {
  if (!json.version) {
    throw new Error('A version number is not present in ' + name);
  } else if (json.version !== from) {
    throw new Error('Unexpected version in ' + name + " '" + json.version + "'");
  }
  json.version = to;
  return json;
}

/**
 * Write a JSON file.
 * @private
 * @param {string} name
 * @param {string} jsonPath
 * @param {object} json
 * @returns {undefined}
 * @throws Error
 */
function writeJSON(name, jsonPath, json) {
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(json));
  } catch (error) {
    throw new Error('Unable to write ' + name);
  }
}

module.exports = bump;
