// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Component, ReactElement } from "react";

/**
 * A wrapper whose children will be pre-rendered to static HTML on the server
 * and not hydrated on the client. Can only be used on server.
 */
export class PreRender extends Component {
  render(): ReactElement {
    throw new Error("attempted to render pre-render wrapper component");
  }
}
