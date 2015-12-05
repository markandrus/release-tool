'use strict';

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var semver = require('semver');

function assertValidDevelopmentVersion(version) {
  if (!semver.valid(version) || getPreRelease(version) !== 'dev') {
    throw new Error("Invalid development version '" + version + "'");
  }
  return true;
}

function assertValidReleaseOrReleaseCandidateVersion(version) {
  if (!semver.valid(version)) {
    throw new Error('Release or release candidate version (' + version +
      ') is not a valid Semantic Version');
  }

  var preRelease = getPreRelease(version);
  if (preRelease &&
      !preRelease.match(/^alpha\.?[0-9]*$/) &&
      !preRelease.match(/^beta\.?[0-9]*$/) &&
      !preRelease.match(/^rc\.?[0-9]*$/))
  {
    throw new Error("Not a recognized release candidate version '" + version +
      "'");
  }

  return true;
}

function assertValidSemVer(version) {
  if (!semver.valid(version)) {
    throw new Error("Invalid Semantic Version '" + version + "'");
  }
  return true;
}

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

function getPreRelease(version) {
  version = version.split('-')[1]
  if (version) {
    return version.split('+')[0];
  }
  return null;
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

module.exports.assertTagDoesNotExist = assertTagDoesNotExist;
module.exports.assertValidDevelopmentVersion = assertValidDevelopmentVersion;
module.exports.assertValidReleaseOrReleaseCandidateVersion =
  assertValidReleaseOrReleaseCandidateVersion;
module.exports.assertValidSemVer = assertValidSemVer;
module.exports.flip2 = flip2;
module.exports.getPreRelease = getPreRelease;
module.exports.lift = lift;
module.exports.readJSON = readJSON;
