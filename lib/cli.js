'use strict';

var commander = require('commander');
var constants = require('./constants');
var env = require('./env');

/**
 * Assert that the program contains a valid number of arguments.
 * @private
 * @param {object} program
 * @returns {undefined}
 * @throws {Error}
 */
function assertValidArgumentCount(program) {
  var max = program.bump ? 2 : 3;
  if (!program.args.length > max) {
    throw new Error('Too many arguments');
  }
}

/**
 * Start the program.
 * @param {object} process
 * @param {object} pkg
 * @param {object} config
 * @returns {object}
 * @throws {Error}
 */
function cli(process, pkg, config) {
  var program = commander
    .version(pkg.version)
    .description(
  'release is a tool for releasing software. It supports bumping version numbers\n' +
'  in JavaScript projects out-of-the-box, but is otherwise generic enough to\n' +
'  release any kind of software. Run release with no arguments for interactive\n' +
'  mode.\n\n' +
'  For more information, refer to the README.')
    .usage('[Options...] [CURRENT_VERSION] [RELEASE_VERSION] [DEVELOPMENT_VERSION]')
    .option('-b, --bump', 'bump the version number from version FROM ' +
                          'to\n                       version TO ')
    .option('-n, --non-interactive', 'run in non-interactive mode ' +
                                     '(e.g., in a script)')
    .option('-p, --publish', 'execute the publish plan')
    .option('-s, --slug', 'specify the repository slug ' +
                          '(owner_name/repo_name)')
    .option('-t, --token', 'assign the Travis CI token to use')
    .option('-x, --execute', 'execute the plans (defaults to true unless using Travis CI)')

  // env.addCommandLineOptionsForVariablesUnassignedInConfigPlans(program, config,
  //   constants.excluding);

  program = program.parse(process.argv);
  assertValidArgumentCount(program);
  return program;
}

module.exports = cli;
