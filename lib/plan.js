'use strict';

var colors = require('colors');
var spawn = require('child_process').spawn;

function Plan(commands) {
  this.commands = commands;
}

Plan.prototype.run = function run() {
  return sequenceCommands(this.commands)();
};

Plan.prototype.toString = function toString() {
  return '\n      ' + this.commands.join('\n      ');
};

function Command(command) {
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
        return reject(new Error('%s exited with code %s', command[0], code));
      }
      resolve();
    });
  });
};

Command.prototype.toString = function toString() {
  return this.command.join(' ');
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

function developmentVersionPlan(version) {
  var commands = [
    new Command(['git', 'rm', '-rf', 'dist']),
    new Command(['gulp', 'clean']),
    new Command(['git', 'commit', '-m', 'Continue development on ' + version]),
    new Command(['git', 'push', 'origin', 'master'])
  ];
  return new Plan(commands);
}

function releasePlan(version) {
  var commands = [
    new Command(['git', 'rm', '-rf', '--ignore-unmatch', 'dist']),
    new Command(['gulp', 'clean']),
    new Command(['gulp']),
    new Command(['git', 'add', '-f', 'dist']),
    new Command(['git', 'commit', '-m', 'Release ' + version]),
    new Command(['git', 'tag ' + version]),
    new Command(['git', 'push', 'origin', 'master', '--tags']),
    new Command(['npm', 'publish'])
  ];
  return new Plan(commands);
}

module.exports.developmentVersionPlan = developmentVersionPlan;
module.exports.releasePlan = releasePlan;
