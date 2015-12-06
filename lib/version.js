'use strict';

var semver = require('semver');

/**
 * Assert that a version number is both a Semantic Version number and ends in
 * "-dev" (or some other approved suffix).
 * @param {string} version
 * @returns {undefined}
 * @throws {Error}
 */
function assertValidDevelopmentVersion(version) {
  assertValidSemanticVersion(version);
  var prerelease = getPrerelease(version);
  if (version !== 'dev' &&
      version !== 'snapshot' &&
      version !== 'SNAPSHOT')
  {
    throw new Error("Not a recognized Development Version '" + version + "'");
  }
}

/**
 * Assert that a version number is both a Semantic Version number and not a
 * prerelease version.
 * @private
 * @param {string} version
 * @returns {undefined}
 * @throws {Error}
 */
function assertValidReleaseVersion(version) {
  assertValidSemanticVersion(version);
  var prerelease = getPrerelease(version);
  if (prerelease) {
    throw new Error("A Release cannot include a prerelease version '" + version + "'");
  }
}

/**
 * Assert that a version number is both a Semantic Version number and ends in
 * "-rc" (or some other approvded suffix).
 * @private
 * @param {string} version
 * @returns {undefined}
 * @throws {Error}
 */
function assertValidReleaseCandidateVersion(version) {
  assertValidSemanticVersion(version);
  var prerelease = getPrerelease(version);
  if (!preRelease.match(/^alpha\.?[0-9]*$/) &&
      !preRelease.match(/^beta\.?[0-9]*$/) &&
      !preRelease.match(/^rc\.?[0-9]*$/))
  {
    throw new Error("Not a recognized Release Candidate version '" + version + "'");
  }
}

/**
 * Assert that a version number is either a Release or Releae Candidate version
 * number.
 * @param {string} version
 * @returns {undefined}
 * @throws {Error}
 */
function assertValidReleaseOrReleaseCandidateVersion(version) {
  try {
    assertValidReleaseVersion(version);
  } catch (error) {
    try {
      return assertValidReleaseCandidateVersion(version);
    } catch (error) {
      throw new Error("Not a recognized Release or Release Candidate version '" +
        version + "'");
    }
  }
}

/**
 * Assert that a version number is a Semantic Version number.
 * @param {string} version
 * @returns {undefined}
 * @throws {Error}
 */
function assertValidSemanticVersion(version) {
  if (!semver.valid(version)) {
    throw new Error("Not a Semantic Version '" + version + "'");
  }
}

/**
 * Get the prerelease portion of a Semantic Version number.
 * @private
 * @param {string} version
 * @returns {?string}
 * @throws {Error}
 */
function getPrerelease(version) {
  assertValidSemanticVersion(version);
  version = version.split('-')[1]
  if (version) {
    return version.split('+')[0];
  }
  return null;
}

/*
 * Check if a Semantic Version number is a Release Candidate version.
 * @private
 * @param {string} version
 * @returns {boolean}
 * @throws {Error}
 */
// function isReleaseCandidate(version) {
//   assertValidSemanticVersion(version);
//   try {
//     assertValidReleaseCandidateVersion(version);
//   } catch (error) {
//     return false;
//   }
//   return true;
// }

module.exports.assertValidDevelopmentVersion = assertValidDevelopmentVersion;
module.exports.assertValidReleaseOrReleaseCandidateVersion =
  assertValidReleaseOrReleaseCandidateVersion;
