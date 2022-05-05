// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { includes } from "lodash";
import React, { Fragment, InputHTMLAttributes } from "react";
import { FormType } from "../forms";
import { initialTitle } from "../string-util";

export function TableForm<T>({
  form,
  textAreaFields,
}: {
  form: FormType<T>;
  textAreaFields?: (keyof T)[];
}) {
  const rows = [];

  if (form.formErrors().length > 0) {
    rows.push(
      <tr key="error">
        <th>Error</th>
        <td>
          <ul className="error">
            {form.formErrors().map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </td>
      </tr>
    );
  }

  for (const field of form.fields()) {
    const fieldErrors = form.fieldErrors(field);
    const errorStuff =
      fieldErrors.length === 0 ? (
        <Fragment />
      ) : (
        <ul className="error">
          {fieldErrors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      );

    let input;
    if (form.isChoiceField(field)) {
      const value = form.cleanedDataAsString()[field];
      input = (
        <select defaultValue={value} name={field}>
          {form.fieldChoices(field).map(([name, value]) => (
            <option key={value} value={value}>
              {name}
            </option>
          ))}
        </select>
      );
    } else if (form.isBooleanField(field)) {
      input = (
        <input
          name={field}
          type="checkbox"
          defaultChecked={!!form.cleanedData()[field]}
        />
      );
    } else if (includes(textAreaFields, field)) {
      input = (
        <textarea
          data-cy-input
          name={field}
          cols={50}
          rows={5}
          defaultValue={form.cleanedDataAsString()[field]}
        />
      );
    } else {
      const options: InputHTMLAttributes<unknown> = {};
      if (form.placeholders?.[field]) {
        options.placeholder = form.placeholders[field];
      }
      if (field.toLowerCase().includes("password")) {
        options["type"] = "password";
      }
      input = (
        <input
          name={field}
          defaultValue={form.cleanedDataAsString()[field]}
          size={50}
          {...options}
        />
      );
    }

    rows.push(
      <tr key={field} data-fieldname={field}>
        <th>{initialTitle(field)}</th>
        <td>
          {errorStuff}
          {input}
        </td>
      </tr>
    );
  }

  return <table>{rows}</table>;
}
