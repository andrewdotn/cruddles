// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import React, { Component } from "react";
import { TaskJsonObj } from "../models/task";
import { EditableText } from "./editable-text";

interface TaskListProps {
  initialTasks: TaskJsonObj[];
  originalQs: string;
}

interface TaskListState {
  tasks: TaskJsonObj[];
  qs: string;
}

async function saveUpdate<T>(
  t: TaskJsonObj,
  url: string,
  fieldName: keyof TaskJsonObj,
  value: T
): Promise<T> {
  if (value === t[fieldName]) {
    return value;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ [fieldName]: value }, null, 2),
  });
  if (response.status === 200) {
    let json: any;
    try {
      json = await response.json();
    } catch (err) {
      throw new Error(
        "Server response error. Maybe your session timed out?" +
          ` Try logging in again. Details: ${err.message}`
      );
    }
    if (json.error) {
      throw new Error(json.error);
    }

    return json[fieldName];
  }
  if (response.status === 422) {
    let json;
    try {
      json = await response.json();
    } catch (e) {}
    if (json?.error) {
      throw new Error(json.error);
    }
  }

  const responseText = await response.text();
  const errorMessage = `The server responded with ${response.status} ${response.statusText}`;
  throw new Error(errorMessage + ": " + responseText);
}

export class TaskList extends Component<TaskListProps, TaskListState> {
  constructor(props: TaskListProps) {
    super(props);

    this.state = {
      tasks: this.props.initialTasks,
      qs: this.props.originalQs,
    };
  }

  render() {
    let index = 1;
    return (
      <>
        <p>
          <a className="button sitenav__link" href="/tasks/new">
            Create new task
          </a>
        </p>
        <table className="tasklist">
          <thead>
            <tr>
              <th className="row-number"></th>
              <th>Priority</th>
              <th>Subject</th>
              <th>Body</th>
            </tr>
          </thead>
          <tbody>
            {this.state.tasks.map((t) => {
              return (
                <tr key={t.id}>
                  <td className="row-number">{index++}</td>
                  <td>{t.priority}</td>
                  <td>
                    <a href={`/tasks/${t.id}`}>{t.subject}</a>
                  </td>
                  <td>
                    <EditableText
                      text={t.body ?? ""}
                      onSave={this.saveText(t)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    );
  }

  saveText = (t: TaskJsonObj) => {
    return async (newValue: string, e: EditableText) => {
      try {
        const savedValue = await saveUpdate(
          t,
          `/tasks/${t.id!}/editBody`,
          "body",
          newValue
        );
        t.body = savedValue;
        this.setState({});
        e.finishEditing();
      } catch (err) {
        console.log(err);
        e.setError(`Error: ${err.message}`);
      }
    };
  };
}
