'use strict';

var util = require('./util');

/**
 * Read .release.json.
 * @param {string} root
 * @returns {object}
 * @throws {Error}
 */
function readConfig(root) {
  return util.readJSON('.release.json', root);
}

module.exports = readConfig;
