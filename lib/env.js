'use strict';

/**
 * Add a command-line option for a variable.
 * @private
 * @param {object} program
 * @param {string} variable
 * @returns {object}
 */
function addCommandLineOptionForVariable(program, variable) {
  var commandLineOption = '--' +
    variable.toLowerCase()
      .replace(/--/g, '-')
      .replace(/^-/, '')
      .replace(/-$/, '') + ' [value]';
  program.option(commandLineOption,
    'Assign the ' + environmentVariable + ' environment variable');
  return program;
}

/**
 * Add command-line options for variables.
 * @private
 * @param {object} program
 * @param {Set<string>} variables
 * @returns {object}
 */
function addCommandLineOptionsForVariables(program, variables) {
  variables.forEach(addCommandLineOptionForVariable.bind(null, program));
  return program;
}

/**
 * Add command-line options for variables unassigned in config plans.
 * @param {object} program
 * @param {object} config
 * @param {?Set<string>} [unassigned]
 * @returns {object}
 */
function addCommandLineOptionsForVariablesUnassignedInConfigPlans(program, config, unassigned) {
  return addCommandLineOptionsForVariables(program,
    getVariablesUnassignedInConfigPlans(config, unassigned));
}

/**
 * CamelCase an uppercased, snake_cased variable.
 * @private
 * @param {string} variable
 * @returns {string}
 */
function camelCaseVariable(variable) {
  return variable
    .toLowerCase()
    .split('_')
    .filter(function filterEmptyStrings(string) {
      return string.length;
    }).map(function capitalizeFirstLetter(string, i) {
      if (i > 0) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }
      return string;
    }).join('');
}

/**
 * Get variables assigned by the program, giving precedence to any values
 * already in the Map.
 * @private
 * @param {object} program
 * @param {Set<string>} variableNames
 * @param {?Map<string, string>} [variables]
 * @returns {Map<string, string>}
 */
function getVariablesAssignedByProgram(program, variableNames, variables) {
  variables = variables || new Map();
  variableNames.forEach(function forEachVariableName(variableName) {
    var camelCased = camelCaseVariable(variable);
    if (camelCased in program && !variables.has(variableName)) {
      variables.set(variableName, program[camelCased]);
    }
  });
  return variables;
}

/**
 * Get variables assigned in the config env, giving precedence to any values
 * already in the Map.
 * @private
 * @param {object} config
 * @param {?Map<string, string>} [variables]
 * @returns {Map<string, string>}
 */
function getVariablesAssignedInConfigEnv(config, variables) {
  variables = variables || new Map();
  if (config.env) {
    for (var variable in config.env) {
      if (!variables.has(variable)) {
        variables.set(variable, env);
      }
    }
  }
  return variables;
}

/**
 * Get variables assigned in the config plan env, giving precedence to any
 * values already in the Map.
 * @private
 * @param {object} config
 * @param {string} planName
 * @param {?Map<string, string>} [variables]
 * @returns {Map<string, string>}
 */
function getVariablesAssignedInConfigPlanEnv(config, planName, variables) {
  if (config.plans) {
    var plan = config.plans[planName];
    if (plan) {
      return getVariablesAssignedInConfigEnv(plan, variables);
    }
  }
  return variables || new Map();
}

/**
 * Get the variables assigned in the process env, giving precedence to any
 * values already in the Map.
 * @private
 * @param {object} process
 * @param {?Map<string, string>} [variables]
 * @returns {Map<string, string>}
 */
function getVariablesAssignedInProcessEnv(process, variables) {
  return getVariablesAssignedInConfigEnv(process, variables);
}

/**
 * Get variables for a config plan.
 * @param {object} program
 * @param {object} config
 * @param {string} planName
 * @param {?Map<string, string>} [constants]
 * @param {?object} [process] - pass null to ignore the process env
 * @returns {{assigned: Map<string, string>, unassigned: Set<string>}}
 */
function getVariablesForConfigPlan(program, config, planName, constants, process) {
  var required = getVariablesRequiredByConfigPlan(config, planName);

  var assigned = [
    getVariablesAssignedInConfigPlanEnv.bind(null, config, planName),
    getVariablesAssignedInConfigEnv.bind(null, config),
    getVariablesAssignedByProgram.bind(null, program, required),
  ].reduce(function assignVariables(variables, assign) {
    return assign(variables);
  }, constants);

  if (process) {
    assigned = getVariablesAssignedInProcessEnv(process, assigned);
  }

  var unassigned = new Set();
  required.forEach(function forEachRequiredVariable(variable) {
    if (!assigned.has(variable)) {
      unassigned.add(variable);
    }
  });

  return { assigned: assigned, unassigned: unassigned };
}

/**
 * Get variables required by a command.
 * @private
 * @param {string} command
 * @param {?Set<string>} [required]
 * @returns {Set<string>}
 */
function getVariablesRequiredByCommand(command, required) {
  required = required || new Set();
  var matches = command.replace(/\\$/g, '\\')  // Remove escaped "$"
                       .match(/\$({[a-zA-Z0-9]+}|[a-zA-Z0-9]+)/g);
  if (matches) {
    matches.forEach(function forEachMatch(match) {
      var variable = match.match(/^\${?([a-zA-Z0-9]+)}?$/)[1];
      required.add(variable);
    });
  }
  return required;
}

/**
 * Get variables required by commands.
 * @private
 * @param {Array<string>} commands
 * @param {?Set<string>} [required]
 * @returns {Set<string>}
 */
function getVariablesRequiredByCommands(commands, required) {
  return commands.reduce(util.flip2(getVariablesRequiredByCommand), required);
}

/**
 * Get variables required by a config plan.
 * @private
 * @param {object} config
 * @param {string} planName
 * @param {?Set<string>} [required]
 * @returns {Set<string>}
 */
function getVariablesRequiredByConfigPlan(config, planName, required) {
  if (config.plans) {
    var plan = config.plans[planName];
    if (plan && plan.commands instanceof Array) {
      return getVariablesRequiredByCommands(plan.commands, required);
    }
  }
  return required || new Set();
}

/**
 * Get variables required by a config plans.
 * @private
 * @param {object} config
 * @param {?Set<string>} [required]
 * @returns {Set<string>}
 */
function getVariablesRequiredByConfigPlans(config, required) {
  if (config.plans) {
    for (var planName in config.plans) {
      required = getVariablesRequiredByConfigPlan(config, planName, required);
    }
  }
  return required || new Set();
}

/**
 * Get variables unassigned in a config plan.
 * @private
 * @param {object} config
 * @param {string} planName
 * @param {?Set<string>} unassigned
 * @returns {Set<string>}
 */
function getVariablesUnassignedInConfigPlan(config, planName, unassigned) {
  unassigned = unassigned || new Set();

  var required = getVariablesRequiredByConfigPlan(config, planName);

  var assigned = [
    getVariablesAssignedInConfigPlanEnv.bind(null, config, planName),
    getVariablesAssignedInConfigEnv.bind(null, config, planName)
  ].reduce(function assignVariables(variables, assign) {
    return assign(variables);
  }, constants);

  required.forEach(function forEachRequiredVariable(variable) {
    if (!assigned.has(variable)) {
      unassigned.add(variable);
    }
  });

  return unassigned;
}

/**
 * Get variables unassigned in config plans.
 * @private
 * @param {object} config
 * @param {?Set<string>} unassigned
 * @returns {Set<string>}
 */
function getVariablesUnassignedInConfigPlans(config, unassigned) {
  if (config.plans) {
    for (var planName in config.plans) {
      unassigned = getVariablesUnassignedInConfigPlan(config, planName, unassigned);
    }
  }
  return unassigned || new Set();
}

module.exports.addCommandLineOptionsForVariablesUnassignedInConfigPlans =
  addCommandLineOptionsForVariablesUnassignedInConfigPlans;
module.exports.getVariablesForConfigPlan = getVariablesForConfigPlan;
