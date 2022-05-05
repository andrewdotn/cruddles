// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import React, { Component, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { AutoSizingTextArea } from "../components/auto-sizing-text-area";
import { appendClasses } from "../components/util";

export interface EditableTextProps {
  text?: string;
  /**
   * Optional content to display when not editing, where the save/cancel buttons
   * would go.
   */
  className?: string;
  contentClassNames?: string[];

  onEditStart?: () => void;
  onSave: (newValue: string, editableText: EditableText) => void;
  onChange?: (textArea: AutoSizingTextArea, newValue: string) => void;
  onDone?: () => void;
  title?: string;

  initialState?: EditableTextState;
}

export interface EditableTextState {
  editing: boolean;
  errorMessage?: string;
}

/**
 * Text that turns into an editable textbox when hovered over or clicked on.
 */
export class EditableText extends Component<
  EditableTextProps,
  EditableTextState
> {
  constructor(props: EditableTextProps) {
    super(props);

    this.state = { editing: false, ...this.props.initialState };
  }

  inputBox?: AutoSizingTextArea | null;

  startEditing = (e: MouseEvent) => {
    this.setState(() => ({ editing: true }));
    this.props.onEditStart?.();
  };
  save = () => {
    if (!this.inputBox) {
      return;
    }
    this.props.onSave(this.inputBox!.value, this);
  };
  finishEditing = () => {
    this.setState({ editing: false, errorMessage: undefined });
    this.props.onDone?.();
  };
  clearError = () => {
    this.setState({ errorMessage: undefined });
  };
  setError = (error: string) => {
    this.setState({ errorMessage: error });
  };

  onKey = (target: unknown, e: KeyboardEvent) => {
    e.persist();
    if (e.key === "Escape") {
      this.finishEditing();
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.save();
    }
  };

  get value() {
    if (this.inputBox) {
      return this.inputBox.value;
    }
  }
  set value(text: string | undefined) {
    if (this.inputBox && text !== undefined) {
      this.inputBox.value = text;
    }
  }

  render() {
    const className = appendClasses("editable-text", this.props.className);

    if (this.state.editing) {
      let error: ReactNode = undefined;
      if (this.state.errorMessage) {
        error = (
          <div className="editable-text__error">{this.state.errorMessage}</div>
        );
      }

      return (
        <div className={className}>
          <AutoSizingTextArea
            ref={(r) => (this.inputBox = r)}
            onChange={this.props.onChange}
            wrapperClassName={["editable-text__input "]}
            contentClassName={appendClasses(
              "editable-text__input-content",
              this.props.contentClassNames
            )}
            onKey={this.onKey}
            initialText={this.props.text ?? ""}
          />
          {error}
          <div className="editable-text__buttonrow">
            <span
              className="editable-text__button"
              onClick={this.save}
              title="Shortcut: Enter"
            >
              Save
            </span>
            <span
              className="editable-text__button editable-text__button__right"
              onClick={this.finishEditing}
              title="Shortcut: Escape"
            >
              Cancel
            </span>
          </div>
        </div>
      );
    } else {
      const titleProps = {} as { title?: string };
      if (this.props.title) {
        titleProps.title = this.props.title;
      }

      return (
        <div
          onClick={this.startEditing}
          className={appendClasses(
            appendClasses(
              "editable-text" + " editable-text__text",
              this.props.className
            ),
            this.props.contentClassNames
          )}
          {...titleProps}
        >
          {this.props.text !== "" ? this.props.text : "\u00a0"}
        </div>
      );
    }
  }
}
