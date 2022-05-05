// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

// should be faster to import from just one locale
import faker from "faker/locale/en";

let instance: typeof faker;

export default function seededFaker() {
  if (instance) {
    return instance;
  }

  let seed;
  // The node and browser crypto APIs are different; additionally, *something*
  // on my machine is causing the node `crypto` module to be loaded as
  // `global.crypto` when launching the REPL, or just `node -e
  // 'console.log(crypto)'`, but that’s not visible in tests?!?
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const randArray = new Uint32Array(1);
    crypto.getRandomValues(randArray);
    seed = randArray[0];
  } else {
    const crypto = require("crypto");
    seed = crypto.randomInt(2 ** 32);
  }

  faker.seed(seed);
  return (instance = faker);
}
