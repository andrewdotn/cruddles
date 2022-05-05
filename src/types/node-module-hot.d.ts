// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

// @types/parcel-env or @types/webpack-env have much more specific types, but
// @these conflict with the latest @types/node.
interface NodeModule {
  hot: any;
}
