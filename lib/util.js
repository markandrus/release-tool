'use strict';

var fs = require('fs');
var inquirer = require('inquirer');
var path = require('path');
var semver = require('semver');
var simpleGit = require('simple-git');

function assertTagDoesNotExist(tag) {
  return checkIfTagExists(tag).then(function withTagExists(tagExists) {
    if (tagExists) {
      throw new Error('git tag already exists');
    }
    return true;
  });
}

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

function checkIfTagExists(tag) {
  return getTags().then(function withTags(tags) {
    return tags.indexOf(tag) > -1;
  });
}

function confirm(message, def) {
  def = typeof def === 'boolean' ? def : true;
  return new Promise(function confirmPromise(resolve) {
    inquirer.prompt({
      type: 'confirm',
      name: 'answer',
      message: message,
      default: def
    }, function withAnswer(answer) {
      resolve(answer.answer);
    });
  });
}

function getPreRelease(version) {
  version = version.split('-')[1]
  if (version) {
    return version.split('+')[0];
  }
  return null;
}

function getTags() {
  return new Promise(function tagExistsPromise(resolve, reject) {
    simpleGit().tags(function tagsCallback(error, tags) {
      if (error) {
        return reject(error);
      }
      resolve(tags.all);
    });
  });
}

function lift(f) {
  return function lifted(a) {
    return new Promise(function liftedPromise(resolve) {
      resolve(f(a));
    });
  };
}

function password(message, validations) {
  return prompt(message, validations, null, 'password');
}

function prompt(message, validations, def, type) {
  validations = validations || [];
  validations = validations instanceof Array ? validations : [validations];

  var sequencedValidations;
  if (validations.length) {
    sequencedValidations = validations.reduce(
      function sequenceValidations(validation, next) {
        return function sequencedValidation(a) {
          return validation(a).then(function validationResolved(result) {
            if (result !== true) {
              return result;
            }
            return next(a);
          });
        };
      }, Promise.resolve.bind(Promise, true));
  }

  type = type || 'input';

  return new Promise(function promptPromise(resolve) {
    inquirer.prompt({
      type: type,
      name: 'answer',
      message: message,
      default: def,
      validate: function validate(input) {
        if (!sequencedValidations) {
          return true;
        }
        var done = this.async();
        sequencedValidations(input).then(done,
          function validationRejected(error) {
            done(error.message);
          });
      }
    }, function withAnswer(answer) {
      resolve(answer.answer);
    });
  });
}

function updateVersions(version) {
  var pkgPath = path.join(process.cwd(), 'package.json');
  var pkg = require(pkgPath);
  pkg.version = version;
  return new Promise(function writePackagePromise(resolve, reject) {
    fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n',
      function writeFileCallback(error) {
        if (error) {
          return reject(error);
        }
        resolve();
      }
    );
  }).then(function writePackagePromiseResolved() {
    var bowerPath = path.join(process.cwd(), 'bower.json');
    var bower;
    try {
      bower = require(bowerPath);
    } catch (error) {
      return;
    }
    bower.version = version;
    fs.writeFile(bowerPath, JSON.stringify(bower, null, 2) + '\n',
      function writeFileCallback(error) {
        if (error) {
          return reject(error);
        }
        resolve();
      }
    );
  });
}

module.exports.assertTagDoesNotExist = assertTagDoesNotExist;
module.exports.assertValidDevelopmentVersion = assertValidDevelopmentVersion;
module.exports.assertValidReleaseOrReleaseCandidateVersion =
  assertValidReleaseOrReleaseCandidateVersion;
module.exports.assertValidSemVer = assertValidSemVer;
module.exports.checkIfTagExists = checkIfTagExists;
module.exports.confirm = confirm;
module.exports.getPreRelease = getPreRelease;
module.exports.getTags = getTags;
module.exports.lift = lift;
module.exports.password = password;
module.exports.prompt = prompt;
module.exports.updateVersions = updateVersions;
