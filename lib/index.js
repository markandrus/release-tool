'use strict';

var colors = require('colors');
var path = require('path');
var pkg = require('../package');
var plan = require('./plan');
var semver = require('semver');
var travis = require('./travis');
var util = require('./util');

/**
 * Run the program.
 * @param {object} program
 * @returns Promise<object>
 */
function run(program) {
  return util.lift(checkArguments)(program)
    .then(util.assertNoUncommittedChanges)
    .then(getCurrentVersion)
    .then(printIntroduction)
    .then(getReleaseOrReleaseCandidateVersion)
    .then(getNextDevelopmentVersion)
    .then(getToken)
    .then(getRepo)
    .then(getConfirmation)
    .then(triggerOrRunLocally)
    .catch(function onError(error) {
      console.error('\n  error: %s\n', error.message);
      process.exit(1);
    });
}

/**
 * Check the program arguments.
 * @param {object} program
 * @returns object
 * @throws Error
 */
function checkArguments(program) {
  if (program.args.length > 2) {
    throw new Error('Too many arguments');
  }
  return program;
}

/**
 * Get the current version.
 * @param {object} program
 * @returns object
 * @throws Error
 */
function getCurrentVersion(program) {
  var currentVersion =
    require(path.join(process.cwd(), 'package.json')).version;

  if (!semver.valid(currentVersion)) {
    throw new Error('package.json version (' + currentersion + ') is not a ' +
      'valid Semantic Version');
  } else if (!util.getPreRelease(currentVersion)) {
    throw new Error('package.json version (' + currentVersion + ') is not a ' +
      'prerelease version');
  }

  var bowerVersion;
  try {
    bowerVersion = require(path.join(process.cwd(), 'bower')).version;
  } catch (error) {
    // bower.json is optional.
  }

  if (bowerVersion && currentVersion !== bowerVersion) {
    throw new Error('package.json version (' + currentVersion + ') does not ' +
      'match bower.json version (' + bowerVersion + ')');
  }

  program.currentVersion = currentVersion;
  return program;
}

/**
 * Print the introduction to the tool.
 * @param {object} program
 * @returns {object}
 */
function printIntroduction(program) {
  if (program.server) {
    return program;
  }

  var intro = [
    '',
    'This tool will help you create a Release or Release Candidate of',
    '',
    '    ' + colors.yellow(require(path.join(process.cwd(),
      'package.json')).name),
    '',
    'which is currently at prerelease version ' +
      colors.yellow(program.currentVersion) + '.',
    '',
    'You may be asked a few questions. Then, the tool will describe the ' +
      'steps it',
    'will take to perform the release. You will have a chance to confirm ' +
      'before',
    'the tool makes any changes.',
    '',
    'Press ^C at any time to abort.'
  ].join('\n  ') + '\n';

  console.log(intro);
  return program;
}

/**
 * Get the Release version.
 * @param {object} program
 * @returns Promise<object>
 */
function getReleaseOrReleaseCandidateVersion(program) {
  var releaseVersion = program.args[0] || process.env.RELEASE_VERSION;

  if (!releaseVersion) {
    if (program.server) {
      return Promise.reject(new Error('No RELEASE_VERSION specified'));
    }

    var defaultReleaseVersion = [
      semver.major(program.currentVersion),
      semver.minor(program.currentVersion),
      semver.patch(program.currentVersion)
    ].join('.');

    return util.prompt(
      'Release or Release Candidate version:',
      [ util.assertValidReleaseOrReleaseCandidateVersion,
        util.assertTagDoesNotExist ],
      defaultReleaseVersion
    ).then(function setReleaseVersion(releaseVersion) {
      program.releaseVersion = releaseVersion;
      return program;
    });
  }

  return util.lift(util.assertValidReleaseOrReleaseCandidateVersion)
      (releaseVersion)
    .then(util.assertTagDoesNotExist.bind(null, releaseVersion))
    .then(function setReleaseVersion() {
      program.releaseVersion = releaseVersion;
      return program;
    });
}

/**
 * Get the next Development Version.
 * @param {object} program
 * @returns Promise<object>
 */
function getNextDevelopmentVersion(program) {
  var nextDevelopmentVersion =
    program.args[1] || process.env.NEXT_DEVELOPMENT_VERSION;

  if (nextDevelopmentVersion) {
    try {
      util.assertValidDevelopmentVersion(nextDevelopmentVersion);
    } catch (error) {
      return Promise.reject(error);
    }

    program.nextDevelopmentVersion = nextDevelopmentVersion;
    return Promise.resolve(program);
  }

  if (program.server) {
    return Promise.resolve(program);
  }

  return util.confirm('Continue on Development Version?').then(
    function withSpecifyNextDevelopmentVersion(specifyNextDevelopmentVersion) {
      if (!specifyNextDevelopmentVersion) {
        return program;
      }

      var defaultDevelopmentVersion = [
        semver.major(program.releaseVersion),
        semver.minor(program.releaseVersion),
        semver.patch(program.releaseVersion)
      ].join('.');

      if (!util.getPreRelease(program.releaseVersion)) {
        defaultDevelopmentVersion = semver.inc(defaultDevelopmentVersion,
          'patch');
      }

      defaultDevelopmentVersion += '-dev';

      return util.prompt(
        'Development Version:',
        [
          util.assertValidDevelopmentVersion
        ],
        defaultDevelopmentVersion
      ).then(function setNextDevelopmentVersion(_nextDevelopmentVersion) {
        program.nextDevelopmentVersion = _nextDevelopmentVersion;
        return program;
      });
    }
  );
}

/**
 * Get the token.
 * @param {object} program
 * @returns Promise<object>
 */
function getToken(program) {
  if (program.token || program.server || program.local) {
    return Promise.resolve(program);
  }

  return util.password(
      'Travis CI token:',
      function validateLength(token) {
        if (!token.length) {
          throw new Error('A Travis CI token is required');
        }
        return true;
      }
    ).then(function setToken(token) {
      program.token = token;
      return program;
    });
}

/**
 * Get the repo.
 * @param {object} program
 * @returns Promise<object>
 */
function getRepo(program) {
  if (program.repo || program.server || program.local) {
    if (!program.repo.match(/^[a-zA-Z0-9\-]+\/[a-zA-Z0-9\-]+$/)) {
      return Promise.reject(
        new Error("Repository name must be of the form 'x/y'"));
    }
    return Promise.resolve(program);
  }

  return util.prompt(
      'Repository (x/y):',
      function validateRepo(repo) {
        if (!repo.match(/^[a-zA-Z0-9\-]+\/[a-zA-Z0-9\-]+$/)) {
          throw new Error("Repository name must be of the form 'x/y'");
        }
        return true;
      }
    ).then(function setRepo(repo) {
      program.repo = repo;
      return program;
    }
  );
}

/**
 * Get confirmation to proceed.
 * @param {object} program
 * @returns Promise<program>
 */
function getConfirmation(program) {
  if (!program.server) {
    console.log([
      '',
      'In order to perform the release, this tool will instruct the build ' +
        'server to',
      'update the version number in package.json (and any bower.json)',
      '',
      '    ' + colors.yellow(program.currentVersion) + ' → ' +
        colors.red(program.releaseVersion) + '',
      '',
      'before running'
    ].join('\n  '));
  }

  program.releasePlan = plan.getPlan('release', {
    RELEASE_VERSION: program.releaseVersion
  });

  if (!program.server) {
    console.log('%s\n', program.releasePlan);
  }

  if (program.nextDevelopmentVersion) {
    if (!program.server) {
      console.log([
        '',
        'Then, in order to continue the next Development Version, this tool ' +
          'will',
        'instruct the build server to update the version number in ' +
          'package.json',
        '(and any bower.json)',
        '',
        '    ' + colors.red(program.releaseVersion) + ' → ' +
          colors.green(program.nextDevelopmentVersion) + '',
        '',
        'before running'
      ].join('\n  '));
    }

    program.developmentPlan =
      plan.getPlan('development', {
        NEXT_DEVELOPMENT_VERSION: program.nextDevelopmentVersion
      });

    if (!program.server) {
      console.log('%s\n', program.developmentPlan);
    }
  }

  if (program.server) {
    return Promise.resolve(program);
  }

  return util.confirm('Is that OK?', false)
    .then(function continueOrAbort(answer) {
      if (!answer) {
        throw new Error('User aborted');
      }

      return program;
    });
}

/**
 * Trigger the program plans on the build server or run them locally.
 * @param {object} program
 * @param Promise<object>
 */
function triggerOrRunLocally(program) {
  if (program.server || program.local) {
    console.log(colors.underline('\nUpdating version…'));
    return util.updateVersions(program.releaseVersion)
      .then(function updatedVersion() {
        var isCandidate = util.getPreRelease(program.releaseVersion);
        console.log(colors.underline('\nCreating Release' +
          (isCandidate ? ' Candidate' : '') + '…'));
        return program.releasePlan.run();
      }).then(function releasePlanResolved() {
        if (!program.developmentPlan) {
          return program;
        }
        console.log(colors.underline('\nUpdating version…'));
        return util.updateVersions(program.nextDevelopmentVersion)
          .then(function updatedVersion() {
            console.log(colors.underline(
              '\nContinuing on Development Version…'));
            return program.developmentPlan.run()
              .then(function developmentPlanResolved() {
                return program;
              });
          });
      });
  }
  return travis.triggerBuild(program).then(function withResponse(response) {
    console.log(response);
    return response;
  });
}

module.exports = run;
