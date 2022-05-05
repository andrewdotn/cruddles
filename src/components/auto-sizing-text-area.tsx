// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import React, { ChangeEvent, Component, KeyboardEvent } from "react";
import { appendClasses } from "./util";

interface AutoSizingTextAreaProps {
  initialText: string;
  onChange?: (textArea: AutoSizingTextArea, newValue: string) => void;
  // onKeyPress would be the more usual event handler, but doesn’t allow
  // preventDefault(). Having this handle both works for now because Escape
  // doesn’t go to onKeyDown, and preventDefault in onKeyPress for Enter
  // prevents onKeyDown from firing the handler again.
  onKey?: (
    textArea: AutoSizingTextArea,
    key: KeyboardEvent<HTMLTextAreaElement>
  ) => void;
  /** For customizing CSS on different instances */
  wrapperClassName?: string | string[];
  contentClassName?: string | string[];
}
interface AutoSizingTextAreaState {
  text: string;
}

/**
 * A text area that resizes itself on creation to fit its contents, and
 * grows/shrinks to fit the content.
 *
 * Based on answer by Jan Miksovsky:
 * https://stackoverflow.com/questions/7477/how-to-autosize-a-textarea-using-prototype/2032642#2032642
 */
export class AutoSizingTextArea extends Component<
  AutoSizingTextAreaProps,
  AutoSizingTextAreaState
> {
  private textarea: HTMLTextAreaElement | null = null;

  constructor(props: AutoSizingTextAreaProps) {
    super(props);

    this.state = { text: props.initialText };
  }

  get value() {
    return this.state.text;
  }
  set value(text: string) {
    if (this.textarea) {
      this.textarea.value = text;
    }
    this.setState((s) => ({ text }));
  }

  resize = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.currentTarget.value;
    this.setState((s) => ({ text }));
    if (this.props.onChange) {
      this.props.onChange(this, text);
    }
  };

  onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (this.props.onKey) {
      this.props.onKey(this, e);
    }
  };

  render() {
    return (
      <div
        className={appendClasses(
          "auto-sizing-text-area",
          this.props.wrapperClassName
        )}
      >
        <textarea
          autoFocus
          className={appendClasses(
            "auto-sizing-text-area__input",
            this.props.contentClassName
          )}
          defaultValue={this.props.initialText}
          onChange={this.resize}
          onKeyDown={this.onKey}
          onKeyPress={this.onKey}
          ref={(r) => (this.textarea = r)}
        />
        <div
          className={appendClasses(
            "auto-sizing-text-area__textcopy",
            this.props.contentClassName
          )}
        >
          {this.state.text}
        </div>
      </div>
    );
  }
}
