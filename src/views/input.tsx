// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { randomId } from "../fw/util";
import React from "react";
import { initialTitle } from "../fw/string-util";

export function Input({
  name,
  labelText,
  value,
  errors,
  type,
}: {
  name: string;
  labelText?: string;
  value: string;
  errors: string[];
  type?: "text" | "password";
}) {
  const id = randomId();

  return (
    <div className="form__control">
      <label className="form__element form__label" htmlFor={id}>
        {labelText ?? initialTitle(name)}
      </label>
      {errors.map((s, index) => (
        <div key={index} className="form__error">
          {s}
        </div>
      ))}
      <input
        className="form__input"
        type={type ?? "text"}
        id={id}
        name={name}
        defaultValue={value}
      ></input>
    </div>
  );
}
