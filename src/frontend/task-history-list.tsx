// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import React, { Component, Fragment } from "react";
import { TaskChange, TaskHistoryJsonObj } from "../models/task-history";
import { Change, diffWords } from "diff";
import classNames from "classnames";

function diffClassNameFor(piece: Change) {
  if (piece.added) {
    return "history-list__value history-list__value-added";
  } else if (piece.removed) {
    return "history-list__value history-list__value-removed";
  } else {
    return "history-list__value";
  }
}

class TaskHistoryLi extends Component<{
  row: TaskHistoryJsonObj;
  hideNonDescriptionChanges?: boolean;
  hideSelfChanges?: boolean;
}> {
  render() {
    const changes = [];
    const change: TaskChange = JSON.parse(this.props.row.change!);
    let index = 0;
    let descriptionChange = false;
    for (const c of change) {
      if ("created" in c) {
        changes.push("created");
        continue;
      }

      if (
        (c.before == null && c.after === "") ||
        (c.before === "" && c.after == null) ||
        (c.before == null && c.after == null)
      ) {
        continue;
      }

      let fieldName: string = c.field;

      if (typeof c.before === "number" && typeof c.after === "string") {
        c.before = c.before.toString();
      }
      if (c.before !== c.after) {
        if (fieldName === "description") {
          descriptionChange = true;
        }

        if (changes.length > 0) {
          changes.push("; ");
        }
        const diff = diffWords(
          c.before?.toString() ?? "",
          c.after?.toString() ?? ""
        );
        changes.push(
          <Fragment key={index++}>
            <span key={index++} className="history-list__field-name">
              {fieldName}
            </span>{" "}
            changed:{" "}
            {diff.map((piece) => (
              <span
                key={index++}
                className={`${diffClassNameFor(
                  piece
                )} history-list__${fieldName}`}
              >
                {piece.value}
              </span>
            ))}
          </Fragment>
        );
      }
    }

    const className = classNames("history-list__row__locked");
    const hiddenProps = {} as { hidden?: boolean };
    if (this.props.hideNonDescriptionChanges && !descriptionChange) {
      hiddenProps.hidden = true;
    }
    if (
      this.props.hideSelfChanges &&
      this.props.row.userId === this.props.userId
    ) {
      hiddenProps.hidden = true;
    }

    if (changes.length > 0) {
      return (
        <li className={className} {...hiddenProps}>
          {this.props.row.createdAt!.toString()}
          {this.props.row.task && (
            <>
              {" "}
              <a
                className="history-list__task-link"
                href={`/tasks/${this.props.row.task.id}`}
              >
                {this.props.row.task?.body}
              </a>
            </>
          )}
          : {changes}
        </li>
      );
    }
    return false;
  }
}

interface TaskHistoryListProps {
  historyItems: TaskHistoryJsonObj[];
}

export class TaskHistoryList extends Component<
  TaskHistoryListProps,
  {
    onlyShowDescriptionChanges?: boolean;
    onlyShowOtherPeoplesChanges?: boolean;
  }
> {
  constructor(props: TaskHistoryListProps) {
    super(props);
    this.state = {
      onlyShowDescriptionChanges: false,
      onlyShowOtherPeoplesChanges: false,
    };
  }

  descriptionChangesOnlyCheckbox?: HTMLInputElement | null;
  onlyOtherPeoplesChangesCheckbox?: HTMLInputElement | null;

  setOnlyShowDescriptionChanges = () => {
    if (this.descriptionChangesOnlyCheckbox?.checked != undefined) {
      this.setState({
        onlyShowDescriptionChanges: this.descriptionChangesOnlyCheckbox.checked,
      });
    }
  };

  setOnlyShowOtherPeoplesChanges = () => {
    if (this.onlyOtherPeoplesChangesCheckbox?.checked != undefined) {
      this.setState({
        onlyShowOtherPeoplesChanges: this.onlyOtherPeoplesChangesCheckbox
          .checked,
      });
    }
  };

  componentDidMount() {
    this.setOnlyShowDescriptionChanges();
    this.setOnlyShowOtherPeoplesChanges();
  }

  render() {
    const items = this.props.historyItems.map((r) => (
      <TaskHistoryLi
        hideNonDescriptionChanges={this.state.onlyShowDescriptionChanges}
        hideSelfChanges={this.state.onlyShowOtherPeoplesChanges}
        key={r.id}
        row={r}
      />
    ));
    let inner;
    if (items.length > 0) {
      inner = <ul>{items}</ul>;
    } else {
      inner = <p>No recorded changes.</p>;
    }
    return (
      <div className="history-list">
        <h2>History</h2>
        <label>
          <input
            ref={(r) => (this.descriptionChangesOnlyCheckbox = r)}
            onClick={this.setOnlyShowDescriptionChanges}
            defaultChecked={this.state.onlyShowDescriptionChanges}
            type="checkbox"
          />
          Only show changes that affect descriptions
        </label>
        <br />
        <label>
          <input
            ref={(r) => (this.onlyOtherPeoplesChangesCheckbox = r)}
            onClick={this.setOnlyShowOtherPeoplesChanges}
            defaultChecked={this.state.onlyShowOtherPeoplesChanges}
            type="checkbox"
          />
          Only show changes made by other users
        </label>

        {inner}
      </div>
    );
  }
}
