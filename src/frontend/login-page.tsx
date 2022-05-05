// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import React, { PropsWithChildren } from "react";
import { randomId } from "../fw/util";

export function LoginPage(
  props: PropsWithChildren<{ username?: string; errorMsg?: string }> = {}
) {
  const usernameId = randomId();
  const passwordId = randomId();

  return (
    <div className="form">
      <form method="POST" action="/login">
        <h1>Welcome</h1>
        {props.errorMsg ? (
          <h2 className="form__error">{props.errorMsg}</h2>
        ) : (
          ""
        )}
        <label htmlFor={usernameId} className="form__element form__label">
          Username
        </label>
        <input
          id={usernameId}
          defaultValue={props.username ?? ""}
          className="form__element"
          name="username"
        />
        <br />
        <label htmlFor={passwordId} className="form__element form__label">
          Password
        </label>
        <input
          id={passwordId}
          className="form__element"
          type="password"
          name="password"
        />
        <br />
        <input className="button form__element" type="submit" value="Log in" />
      </form>
    </div>
  );
}
