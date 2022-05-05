// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import React, { PropsWithChildren, useState } from "react";
import { User, UserJsonObj } from "../models/user";
import {
  Alert,
  AlertProps,
  Dropdown,
  Nav,
  Navbar,
  NavDropdown,
} from "react-bootstrap";
import { Request } from "express";
import parseurl from "parseurl";
import { FlashItem } from "../server";
import { MySplitButton } from "../hacks/better-split-dropdown/my-split-button";

interface SiteNavProps {
  user?: UserJsonObj | User;
  pathname: string;
  flash?: FlashItem[];
  initialPresentationMode?: boolean;
}

function DismissibleAlert(
  props: PropsWithChildren<{ variant: AlertProps["variant"] }>
) {
  const [show, setShow] = useState(true);

  if (show) {
    return (
      <Alert
        className="mx-4 mt-4 mb-0"
        variant={props.variant}
        onClose={() => setShow(false)}
        dismissible
      >
        {props.children}
      </Alert>
    );
  }
  return null;
}

export class SiteNav extends React.Component<
  SiteNavProps,
  { mounted: boolean; presentationMode: boolean }
> {
  constructor(props: SiteNavProps) {
    super(props);

    this.state = {
      mounted: false,
      presentationMode: props.initialPresentationMode ?? false,
    };
  }

  static propsFromRequest(req: Request): SiteNavProps {
    const ret = {
      pathname: parseurl({ url: req.url })?.pathname ?? "",
      user: req.user?.toJsonObj(),
      flash: req.session?.flash,
      initialPresentationMode: req.session?.presentationMode,
    };
    if (req.session?.flash) {
      req.session.flash = undefined;
    }
    return ret;
  }

  togglePresentationMode = async () => {
    console.log("toggling");
    const response = await fetch("/togglePresentationMode", { method: "POST" });
    console.log(response.status);
    const body = await response.json();
    if ("newValue" in body) {
      console.log(this);
      this.setState({ presentationMode: body.newValue });
    }
  };

  componentDidMount(): void {
    this.setState({ mounted: true });
  }

  spinner() {
    return (
      !this.state.mounted && (
        <Nav.Item className="align-self-center">
          <div
            className="spinner-border spinner-border-sm text-secondary"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </Nav.Item>
      )
    );
  }

  render() {
    return (
      <>
        <Navbar bg="light">
          <Nav className="mr-auto" activeKey={this.props.pathname}>
            <Nav.Link href={`/tasks`}>My tasks</Nav.Link>
          </Nav>

          <Nav activeKey={this.props.pathname}>
            {this.spinner()}
            <NavDropdown title="Menu" id="basic-nav-dropdown" alignRight={true}>
              <NavDropdown.Header>Help</NavDropdown.Header>
              <NavDropdown.Item href="/about">About</NavDropdown.Item>
              <NavDropdown.Divider />
              <form method="POST" action="/logout">
                <NavDropdown.Item as="button">Log out</NavDropdown.Item>
              </form>
            </NavDropdown>
          </Nav>
        </Navbar>

        {(this.props.flash ?? []).map((f, i) => (
          <DismissibleAlert key={i} variant={f.variant}>
            <div
              dangerouslySetInnerHTML={{ __html: f.dangerouslySetHtmlContent }}
            />
          </DismissibleAlert>
        ))}

        <div className="sitemain">
          <div className="sitemain__inner">{this.props.children}</div>
        </div>
      </>
    );
  }
}
