// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

/**
 * An Error subclass that automatically uses the Error class name in the
 * message. */
export class SelfDescribingError extends Error {
  constructor(message?: string) {
    super();
    this.message = this.constructor.name + (message ? ": " + message : "");
  }
}
