'use strict';

  // These are always set by the program.
var constants = [
  'BRANCH',
  'CURRENT_VERSION',
  'RELEASE_VERSION',
  'DEVELOPMENT_VERSION'
];

var excluding = constants.reduce(function constructExcluding(excluding, constant) {
  excluding.set(constant);
  return excluding;
}, new Map());

module.exports.excluding = excluding;
