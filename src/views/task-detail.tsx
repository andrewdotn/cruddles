// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { TaskJsonObj } from "../models/task";
import React, { PropsWithChildren } from "react";
import { LinkToTask } from "../components/link-to-task";

export function TaskDetail(props: PropsWithChildren<{ task: TaskJsonObj }>) {
  const t = props.task;
  return (
    <>
      <h1>
        <LinkToTask task={t} />
      </h1>
      {props.children ?? []}
      <p>
        <a className="button sitenav__link" href={`/tasks/${t.id}/edit`}>
          Edit
        </a>
        <a className="button sitenav__link" href={`/tasks/new?clone=${t.id}`}>
          Clone
        </a>
      </p>
      <table>
        <tbody>
          <tr>
            <th>Subject</th>
            <td>{t.subject}</td>
          </tr>
          <tr>
            <th>Description</th>
            <td>{t.body}</td>
          </tr>
          <tr>
            <th>Priority</th>
            <td>{t.priority}</td>
          </tr>
          <tr>
            <th>Created</th>
            <td>{t.createdAt?.toString()}</td>
          </tr>
          {t.createdAt !== t.updatedAt && (
            <>
              <tr>
                <th>Updated</th>
                <td>{t.updatedAt?.toString()}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </>
  );
}
