release
=======

release is a tool for releasing software. It supports bumping version numbers
in JavaScript projects out-of-the-box, but is otherwise generic enough to
release any kind of software.

```
npm install --save-dev release
```

Usage
-----

By default, the tool runs in an interactive client mode. It will prompt you for
the version numbers and plans you want to execute before confirming whether or
not to proceed.

```
$ ./node_modules/.bin/release --help
```

### bump

The tool also bundles a "bump" subcommand for updating version numbers in
supported types of software projects (currently only JavaScript). It will bump
the version number in package.json (and bower.json, if it exists) from version
`FROM` to version `TO`:

```
$ ./node_modules/.bin/release bump ${FROM} ${TO}
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
and tagging the Software. In order to continue a Development Version, the
version number must be bumped before committing the Software.


```json
{
  "type": "JavaScript",
  "travis": true,
  "env": {
    "REPO": "markandrus/release-tool",
    "GH_REF": "markandrus/release-tool.git"
  },
  "plans": {
    "release": {
      "env": {
        "GIT_USER_NAME": "travis-ci",
        "GIT_USER_EMAIL": "travis@travis-ci.org"
      },
      "commands": [
        "./node_modules/.bin/release bump ${CURRENT_VERSION} ${RELEASE_VERSION}",
        "git config --global user.name \"${GIT_USER_NAME}\"",
        "git config --global user.email \"${GIT_USER_EMAIL}\"",
        "git add .",
        "git commit -m \"Release ${RELEASE_VERSION}\"",
        "git tag ${RELEASE_VERSION}",
      ]
    },
    "development": {
      "commands": [
        "./node_modules/.bin/release bump ${RELEASE_VERSION} ${DEVELOPMENT_VERSION}",
        "git add .",
        "git commit -m \"Continue development on ${DEVELOPMENT_VERSION}\"",
        "git push \"https://${GH_TOKEN}@${GH_REF}\" ${BRANCH}"
      ]
    },
    "publish": {
      "commands": [
        "git push \"https://${GH_TOKEN}@${GH_REF}\" ${BRANCH} --tags",
        "git checkout ${RELEASE_VERSION}",
        "npm publish"
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
