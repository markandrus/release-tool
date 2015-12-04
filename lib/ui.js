'use strict';

var inquirer = require('inquirer');

/**
 * Prompt the user for confirmation.
 * @param {string} message
 * @param {?boolean} [default=false]
 * @returns Promise<boolean>
 */
function confirm(message, def) {
  def = typeof def === 'boolean' ? def : false;
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

/**
 * Prompt the user for a password.
 * @param {string} message
 * @param {?(function|Array<function>)} validations
 * @returns {Promise<string>}
 */
function password(message, validations) {
  return prompt(message, validations, null, 'password');
}

/**
 * Prompt the user for input.
 * @param {string} message
 * @param {?(function|Array<function>)} validations
 * @param {?string} [def] - default or suggested input
 * @param {?string} [type='input']
 * @returns {Promise<string>}
 */
function input(message, validations, def, type) {
  validations = validations || [];
  validations = validations instanceof Array ? validations : [validations];

  var sequencedValidations;
  if (validations.length) {
    // TODO(mroberts): This seems generic enough to pull out into a separate
    // function. Are we using it anywhere else?
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

  return new Promise(function inputPromise(resolve) {
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

module.exports.confirm = confirm;
module.exports.password = password;
module.exports.input = input;
