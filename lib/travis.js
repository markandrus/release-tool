'use strict';

var https = require('https');
var util = require('./util');

function triggerBuild(program) {
  return new Promise(function triggerBuildPromise(resolve, reject) {
    var options = {
      hostname: 'api.travis-ci.' + (program.travis === 'pro' ? 'com' : 'org'),
      port: 443,
      path: '/repo/' + encodeURIComponent(program.slug) + '/requests',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Travis-API-Version': 3,
        'Authorization': 'token ' + program.token,
      }
    };

    var body = {
      request: {
        branch: program.branch,
        config: {
          after_success: './node_modules/.bin/release -b ' + program.branch +
            ' -n' +
            (program.publish ? ' -p' : '') +
            ' -x ' +
            program.currentVersion + ' ' +
            program.releaseVersion +
            (program.developmentVersion ? ' ' + program.developmentVersion : '')
        }
      }
    };

    var request = https.request(options, function withResponse(response) {
      var responseBody = '';

      response.on('data', function onData(chunk) {
        responseBody += chunk;
      });

      response.once('end', function onceEnded() {
        resolve(responseBody);
      });
    });

    request.once('error', function onceErrored(error) {
      reject(error);
    });

    request.end(JSON.stringify(body));
  });
}

module.exports.triggerBuild = triggerBuild;
