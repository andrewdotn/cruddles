// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Component, FunctionComponent } from "react";

export type ComponentType = typeof Component | FunctionComponent<any>;

export class TypeMap {
  private byComponent: Map<ComponentType, string>;
  private byName: Map<string, ComponentType>;

  constructor() {
    this.byComponent = new Map();
    this.byName = new Map();
  }

  getClassOrThrow(name: string): ComponentType {
    const ret = this.byName.get(name);
    if (!ret) {
      throw new Error(`Couldn’t find component ${name}`);
    }
    return ret;
  }

  getNameOrThrow(cls: ComponentType): string {
    const ret = this.byComponent.get(cls);
    if (!ret) {
      throw new Error(`Couldn’t find name for ${cls}`);
    }
    return ret;
  }

  register(cls: ComponentType, name: string) {
    if (!cls) {
      throw new Error(`given ${cls} for name ${name}`);
    }
    if (this.byName.has(name) && this.byName.get(name) !== cls) {
      throw new Error(`${name} is already in use`);
    }
    if (this.byComponent.has(cls) && this.byComponent.get(cls) !== name) {
      throw new Error(`${cls} is already registered as ${name}`);
    }
    this.byComponent.set(cls, name);
    this.byName.set(name, cls);
  }
}
