'use strict';

var colors = require('colors');
var fs = require('fs');
var path = require('path');
var shellQuote = require('shell-quote');
var spawn = require('child_process').spawn;

function Plan(commands, options) {
  this.commands = commands.map(function parseCommands(command) {
    return new Command(command, options);
  });
}

Plan.prototype.run = function run() {
  return sequenceCommands(this.commands)();
};

Plan.prototype.toString = function toString() {
  return '\n      ' + this.commands.join('\n      ');
};

function Command(command, options) {
  if (command instanceof Command) {
    return command;
  } else if (!(this instanceof Command)) {
    return new Command(command, options);
  } else if (typeof command === 'string') {
    command = shellQuote.parse(command, options);
  }
  this.command = command;
}

Command.prototype.run = function run() {
  var command = this.command;
  var self = this;
  return new Promise(function runPromise(resolve, reject) {
    console.log(colors.bold(self));
    var child = spawn(command[0], command.slice(1), { stdio: 'inherit' });
    child.once('close', function childClosed(code) {
      if (code) {
        return reject(new Error(command[0] + ' exited with code ' + code));
      }
      resolve();
    });
  });
};

Command.prototype.toString = function toString() {
  return shellQuote.quote(this.command);
};

function sequenceCommands(commands) {
  return commands.reduce(
    function sequenceCommands(command, next) {
      return function sequenced() {
        return command().then(next.run.bind(next));
      };
    },
    Promise.resolve.bind(Promise)
  );
}

function getPlan(planName, options) {
  var rtrcPath = path.join(process.cwd(), '.rtrc');
  var rtrc;
  try {
    fs.statSync(rtrcPath);
    try {
      rtrc = JSON.parse(fs.readFileSync(rtrcPath).toString());
    } catch (error) {
      throw new Error('.rtrc is not valid JSON');
    }
  } catch (error) {
    // Continue using defaults.
  }

  switch (planName) {
    case 'development':
      return rtrc
        ? new Plan(rtrc[planName].commands, options)
        : defaultDevelopmentPlan(options);
    case 'release':
      return rtrc
        ? new Plan(rtrc[planName].commands, options)
        : defaultReleasePlan(options);
    default:
      throw new Error('No plan exists in an .rtrc, nor in the defaults for ' +
                      "'" + planName + "'");
  }
}

function defaultDevelopmentPlan(options) {
  return new Plan([
    'git add .',
    'git commit -m "Continue development on ${NEXT_DEVELOPMENT_VERSION}"'
  ], options);
}

function defaultReleasePlan(options) {
  return new Plan([
    'git add .',
    'git commit -m "Release ${RELEASE_VERSION}"',
    'git tag ${RELEASE_VERSION}'
  ], options);
}

module.exports.getPlan = getPlan;
module.exports.defaultDevelopmentPlan = defaultDevelopmentPlan;
module.exports.defaultReleasePlan = defaultReleasePlan;
