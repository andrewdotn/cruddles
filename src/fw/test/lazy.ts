// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Context } from "mocha";

type Provider<T> = () => T | Promise<T>;
type Cleanup<T, C> = (t?: T, err?: Error) => C;
type LazyResult<T> = (() => Promise<T>) & { close: () => Promise<void> };

/**
 * A test helper to provide initialization routines inside describe blocks,
 * that are only invoked if needed, and automatically get cleaned up in
 * afterEach() hooks.
 */
export function lazy<T>(provider: () => T): LazyResult<T>;
export function lazy<T, C>(
  provider: () => T,
  cleanup: () => C,
  context?: Context
): LazyResult<T>;
export function lazy<T, C>(
  provider: () => T,
  cleanup: (t: T) => C
): LazyResult<T>;
export function lazy<T, C>(
  provider: () => Promise<T>,
  cleanup: (t: T) => C,
  context?: Context
): LazyResult<T>;
export function lazy<T>(
  provider: () => Promise<T>,
  cleanup: (t: T) => unknown
): LazyResult<T>;
export function lazy<T, C>(
  provider: () => Promise<T>,
  cleanup?: Cleanup<T, Promise<C>>
): LazyResult<T>;

export function lazy<T, C>(
  provider: () => T,
  cleanup?: Cleanup<T, C>,
  context?: Context
) {
  const l = new Lazy<T, C>(provider, cleanup, context);
  const ret = () => l.get();
  ret.close = l.close.bind(l);
  return ret;
}

class Lazy<T, C> {
  private provider: Provider<T>;
  private cleanup?: Cleanup<T, C>;
  private providerPromise?: Promise<T>;

  /*
   * Mocha doesn’t expose an API to get the test context. Normally we work
   * around it by grabbing `this` from a `beforeEach()` call, but that doesn’t
   * work for `lazy()` calls from inside a test. The workaround is to allow
   * tests to pass that Mocha.Context in directly.
   */
  constructor(
    provider: Provider<T>,
    cleanup?: Cleanup<T, C>,
    passedTestContext?: Context
  ) {
    // const creationStack = new Error().stack;

    this.provider = provider;
    if (cleanup) {
      this.cleanup = cleanup;
    }
    // let savedContext: Context;
    //
    // function prepareCleanupStack(context: Context) {
    //   savedContext = context;
    //
    //   if (
    //     context._cleanupStack === undefined ||
    //     context._currentTestForCleanupStack !== context.currentTest
    //   ) {
    //     if (context?._cleanupStack?.length) {
    //       throw new Error("cleanup stack not empty");
    //     }
    //     context._currentTestForCleanupStack =
    //       context.currentTest ?? context.test;
    //     context._cleanupStack = [];
    //   }
    //   context._cleanupStack.push(lazyObj.close.bind(lazyObj));
    // }
    //
    // if (passedTestContext) {
    //   prepareCleanupStack(passedTestContext);
    // } else {
    //   beforeEach(function(this: Context) {
    //     savedContext = this;
    //     prepareCleanupStack(savedContext);
    //   });
    // }

    afterEach(this.close.bind(this));
    // if (
    //   !savedContext ||
    //   (savedContext !== this && savedContext !== this.currentTest?.ctx) ||
    //   !savedContext._currentTestForCleanupStack
    // ) {
    //   throw new Error(
    //     `lazy afterEach call with lost cleanup stack; original creation stack was ${creationStack}`
    //   );
    // }
    //
    // if (
    //   savedContext._currentTestForCleanupStack !== savedContext.currentTest
    // ) {
    //   throw new Error(`afterEach running for wrong test?`);
    // }
    //
    // return savedContext!._cleanupStack.pop()();
  }

  async get(): Promise<T> {
    if (!this.providerPromise) {
      this.providerPromise = new Promise(async (resolve, reject) => {
        try {
          let ret: T | Promise<T> = this.provider();
          // @ts-ignore
          if (ret?.then) {
            await ret;
          }
          resolve(ret);
        } catch (e) {
          reject(e);
        }
      });
    }
    return this.providerPromise!;
  }

  async close(): Promise<C | undefined> {
    let ret: C | undefined = undefined;
    if (this.providerPromise) {
      let t: T | undefined = undefined;
      let savedE: Error | undefined = undefined;
      try {
        t = await this.providerPromise;
      } catch (e) {
        savedE = e;
      }
      if (this.cleanup) {
        ret = await this.cleanup(t, savedE);
      }
    }
    // Important: because we’re getting closed from an afterEach hook, reset
    // the lazy object state for the next test.
    this.providerPromise = undefined;
    return ret;
  }
}
