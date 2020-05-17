# Pexo

Let's you kickstart your website with a good set of performance defaults to improve the developer experience.

**Main focus and benefits are**

- comes out of the box with server side rendering and data fetching
- true server side streaming, ships components as soon as their data is loaded (even though not all components are ready)
- build in code splitting and client side hydration
- small server side payload, only ships what is required to hydrate
- pushes required resources to the client as early as possible to fetch and parse while the server is still loading
- ready to go build system for development (production mode planned) based on Parcel v2
- integrated two layer cache for view state and domain entities for fast navigation between pages on the client and the server
- clear separation between view model and domain model for well structured code
- does not require a specific backend technology, works with e.g. graphql and rest apis

![](https://img.shields.io/npm/l/@pexo/core.svg)
[![](https://img.shields.io/npm/v/@pexo/core.svg)](https://www.npmjs.com/package/@pexo/core)
[![Build Status](https://travis-ci.org/garthenweb/pexo.svg?branch=master)](https://travis-ci.org/garthenweb/pexo)
[![Coverage Status](https://coveralls.io/repos/github/garthenweb/pexo/badge.svg?branch=master)](https://coveralls.io/github/garthenweb/pexo?branch=master)

**⚠️ This project is an early stage and not stable. We don't recommend shipping it to production (yet) ⚠️**

## Get Started

**TBD**

For now you can have a look into the example folder or check out the tests.

## Contributing

Contributions are highly appreciated!

To get the project started, clone the repository, go into the root folder and run `yarn` (npm is not supported as we use workspaces). Afterwards run `yarn build` to compile all assets.

PRs should always include test cases. If possible, only test public APIs and no implementation details, as those give benefits even though we refactor the internals.
Tests can run locally by executing `yarn test` in the root folder.

Always consider to add a new feature to the example to have a real case to test. After installing dependencies you should be able to navigate to `packages/example` and run `yarn start` to check your local changes.

Please be aware that for now the cli will not use the source code for the example. Therefore, if you test changes on the cli, please run `yarn build` before you test.

Before submitting a PR, please run prettier with the default settings on the changed files (we will most probably implement a command and checker later as well).

To get started with the first task you can check out the issues and search for label ["community: help wanted" and "community: good first issue"](https://github.com/garthenweb/pexo/issues?q=is%3Aopen+is%3Aissue+label%3A%22communitiy%3A+help+wanted%22+label%3A%22communitiy%3A+good+first+issue%22).

## License

Licensed under the [MIT License](https://opensource.org/licenses/mit-license.php).
