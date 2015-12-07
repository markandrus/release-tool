'use strict';

var env = require('./env');
var execSync = require('child_process').execSync;
var os = require('os');

/**
 * Construct a {@link Command}.
 * @class
 * @classdesc A {@link Command} is a command.
 * @private
 * @param {(string|Command)} command
 * @property {string} command
 */
function Command(command) {
  if (command instanceof Command) {
    return command;
  } else if (!(this instanceof Command)) {
    return new Command(command);
  }
  this.command = command;
}

/**
 * Run the {@link Command}.
 * @private
 * @param {?Map<string, string>} [variables]
 * @returns {undefined}
 * @throws {Error}
 */
Command.prototype.run = function run(variables) {
  var env = {};
  if (variables) {
    variables.forEach(function forEachVariable(value, key) {
      env[key] = value;
    });
  }

  console.log(this.command);
  var stdout;
  try {
    stdout = execSync(this.command, { env: env });
  } catch (error) {
    console.log(error);
    throw new Error(this.command.split(' ')[0] +
      ' exited with code ' + error.code);
  }
  console.log(stdout.toString());
}

Command.prototype.toString = function toString() {
  return this.command;
};

/**
 * Construct a {@link Plan}.
 * @class
 * @classdesc A {@link Plan} is a sequence of {@link Command}s.
 * @private
 * @param {Array<(string|Command)>} commands
 * @property {Array<Command>} commands
 */
function Plan(commands) {
  this.commands = commands.map(Command);
}

/**
 * Get a {@link Plan} from a config, if it exists.
 * @private
 * @param {object} config
 * @param {string} planName
 * @returns {?Plan}
 */
Plan.getPlanFromConfig = function getPlanFromConfig(config, planName) {
  if (config.plans && planName in config.plans) {
    return new Plan(config.plans[planName].commands);
  }
  return null;
};

/**
 * Get {@link Plan}s from config.
 * @param {object} config
 * @returns {Map<string, Plan>}
 */
Plan.getPlansFromConfig = function getPlansFromConfig(config) {
  var plans = new Map();
  if (config.plans) {
    for (var planName in config.plans) 
      plans.set(planName, new Plan(config.plans[planName].commands));
  }
  return plans;
};

/**
 * Run the {@link Plan}
 * @private
 * @param {?Map<string, string>} [variables]
 * @returns {undefined}
 * @throws {Error}
 */
Plan.prototype.run = function run(variables) {
  this.commands.forEach(function runCommand(command) {
    command.run(variables);
  });
};

Plan.prototype.toString = function toString() {
  return this.commands.join(os.EOL);
};

module.exports = Plan.getPlansFromConfig;
