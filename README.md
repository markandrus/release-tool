release-tool
============

[![NPM](https://img.shields.io/npm/v/release-tool.svg)](https://www.npmjs.com/package/release-tool) [![Build Status](https://secure.travis-ci.org/markandrus/release-tool.svg)](http://travis-ci.org/markandrus/release-tool)

release-tool is a tool for releasing software. It supports bumping version
numbers in JavaScript projects out-of-the-box, but is otherwise generic enough
to release any kind of software.

```
npm install --save-dev release-tool
```

Usage
-----

By default, the tool runs in an interactive mode. It will prompt you for the
version numbers and plans you want to execute before confirming whether or not
to proceed.

```
$ ./node_modules/.bin/release --help

  Usage: release [Options...] [CURRENT_VERSION] [RELEASE_VERSION|NEXT_VERSION] \
             [DEVELOPMENT_VERSION]

  release is a tool for releasing software. It supports bumping version numbers
  in JavaScript projects out-of-the-box, but is otherwise generic enough to
  release any kind of software. Run release with no arguments for interactive
  mode.

  For more information, refer to the README.

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -b, --branch [branch]  the branch to release from (defaults to the current branch)
    --bump                 bump CURRENT_VERSION to NEXT_VERSION
    -n, --non-interactive  run in non-interactive mode (e.g., in a script)
    -p, --publish          execute the publish plan
    -s, --slug             specify the repository slug (owner_name/repo_name)
    -t, --token            assign the Travis CI token to use
    -x, --execute          execute the plans (defaults to true unless using Travis CI)

```

### --bump

The tool also bundles a "bump" subcommand for updating version numbers in
supported types of software projects (currently only JavaScript). It will bump
the version number in package.json (and bower.json, if it exists) from version
`CURRENT_VERSION` to version `NEXT_VERSION`:

```
$ ./node_modules/.bin/release --bump ${CURRENT_VERSION} ${NEXT_VERSION}
```

.release.json
-------------

The tool executes up to three types of plans on your Software:

1. Release: create a Release (or Release Candidate) of the Software.
2. Development: continue a Development Version (or "snapshot") of the Software.
3. Publish: publish a Release of the Software.

These plans are described in a .release.json file where you can specify exactly
what should happen in each plan.

For example, the tool's own [.release.json](.release.json) specifies that, in
order to create a Release, the version number must be bumped before committing
and tagging the software. In order to continue a Development Version, the
version number must be bumped before committing the Software.


```json
{
  "type": "JavaScript",
  "travis": true,
  "slug": "markandrus/release-tool",
  "env": {
    "GH_REF": "github.com/markandrus/release-tool.git"
  },
  "plans": {
    "release": {
      "env": {
        "GIT_USER_NAME": "travis-ci",
        "GIT_USER_EMAIL": "travis@travis-ci.org"
      },
      "commands": [
        "node ./node_modules/.bin/release --bump ${CURRENT_VERSION} ${RELEASE_VERSION}",
        "git config user.name \"${GIT_USER_NAME}\"",
        "git config user.email \"${GIT_USER_EMAIL}\"",
        "git add .",
        "git commit -m \"Release ${RELEASE_VERSION}\"",
        "git tag ${RELEASE_VERSION}"
      ]
    },
    "development": {
      "commands": [
        "node ./node_modules/.bin/release --bump ${RELEASE_VERSION} ${DEVELOPMENT_VERSION}",
        "git add .",
        "git commit -m \"Continue development on ${DEVELOPMENT_VERSION}\""
      ]
    },
    "publish": {
      "commands": [
        "git remote set-url origin \"https://${GH_TOKEN}@${GH_REF}\"",
        "git rebase HEAD ${BRANCH}",
        "git push origin ${BRANCH} --tags",
        "git checkout ${RELEASE_VERSION}"
      ]
    }
  }
}
```

### Environment Variables

Variables can be assigned in the top-level or plan-level "env" sections. Any
unassigned variables referenced in a plan's commands can be overridden by the
environment or command-line arguments. All other assigned variables are fixed
and cannot be overridden except in the .release.json itself.

Travis CI
---------

If you set the property "travis" to `true` in the top-level of your software's
.release.json, then the tool will not execute any plans locally; instead, it
will POST a request to Travis CI in order to execute the plans.

Be very careful not to leak any sensitive data.
