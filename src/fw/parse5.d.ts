// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

/* I’m not sure how the stuff on DefinitelyTyped is supposed to be used, but every
 * signature there is `Foo | object` with a comment about needing to cast…
 *
 * Here’s a minimum type that has the fields I need.
 */

declare module "parse5" {
  export interface Element {
    nodeName: string;
    attrs?: { name: string; value: string }[];
    value?: string;
    data?: string;
    childNodes?: Element[];
  }

  export function parse(s: string): Element;

  // This stub is only here because something in jsdom complains otherwise
  export namespace MarkupData {
    interface ElementLocation {}
  }
}
