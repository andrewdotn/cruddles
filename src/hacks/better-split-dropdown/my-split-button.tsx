// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Dropdown, NavItem, NavLink } from "react-bootstrap";
import React, { PropsWithChildren } from "react";

type Props = {
  href: string;
  title: string;
};

export function MySplitButton({
  href,
  title,
  children,
}: PropsWithChildren<Props>) {
  return (
    <Dropdown as={NavItem} className="d-inline-flex dropdown nav-item">
      <NavLink href={href} className="nav-link pr-0">
        {title}
      </NavLink>
      {/* @ts-ignore */}
      <Dropdown.Toggle
        as={NavLink as any}
        className="dropdown-toggle dropdown-toggle-split nav-item align-self-center "
      ></Dropdown.Toggle>
      <Dropdown.Menu>{children}</Dropdown.Menu>
    </Dropdown>
  );
}
