Release Tool
============

release-tool, or [rt](rt), is a tool for releasing JavaScript projects.
Releasing JavaScript projects is fairly mechanical and it's easy to miss steps.
This tool codifies and automates the process.

```
npm install release-tool
```

.rtrc
-----

A [.rtrc](.rtrc) in the root of the JavaScript project you would like to
release allows you to override the [default release and development plans]
(lib/plan.js). For example,

```json
{
  "release": {
    "commands": [
      "make clean",
      "make",
      "git add .",
      "git commit -m \"Release ${RELEASE_VERSION}\"",
      "git tag ${RELEASE_VERSION}",
      "git push origin master",
      "npm publish"
    ]
  },
  "development": {
    "commands": [
      "make clean",
      "git add .",
      "git commit -m \"Continue ${DEVELOPMENT_VERSION}\"",
      "git push origin master",
      "npm publish"
    ]
  }
}
```

Travis CI
---------

[Travis CI](https://travis-ci.org/) integration allows you to use Travis CI as
a build server. Your [.travis.yml](.travis.yml) should include the following
lines in order to trigger release-tool:

```yaml
TODO
```
