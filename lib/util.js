'use strict';

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var semver = require('semver');

/**
 * Flip a binary function.
 * @param {function(A, B): C} f
 * @returns {function(B, A): C}
 */
function flip2(f) {
  return function flipped(a, b) {
    return f(b, a);
  };
}

function lift(f) {
  return function lifted(a) {
    return new Promise(function liftedPromise(resolve) {
      resolve(f(a));
    });
  };
}

/**
 * Read a JSON file. If it must exist, but does not, throw an Error.
 * @param {string} name
 * @param {string} jsonPath
 * @param {?boolean} [mustExist=true]
 * @returns {?object}
 * @throws {Error}
 */
function readJSON(name, jsonPath, mustExist) {
  jsonPath = path.join(jsonPath, name);
  mustExist = typeof mustExist === 'boolean' ? mustExist : true;
  var json;
  var jsonExists = false;
  try {
    fs.statSync(jsonPath);
    jsonExists = true;
  } catch (error) {
    if (mustExist) {
      throw new Error(name + ' does not exist');
    } else {
      return null;
    }
  }
  try {
    return require(jsonPath);
  } catch (error) {
    throw new Error('Unable to read ' + name);
  }
}

module.exports.flip2 = flip2;
module.exports.lift = lift;
module.exports.readJSON = readJSON;
