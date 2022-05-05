// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { randomBytes } from "crypto";

export function appendToMapList<K, V>(m: Map<K, V[]>, k: K, v: V) {
  if (!m.has(k)) {
    m.set(k, []);
  }
  m.get(k)!.push(v);
}

export function randomId() {
  return randomBytes(12).toString("hex");
}

type HasId<U> = U & { id?: number };

export function byIdMap<T extends HasId<U>, U = T>(items: T[]): Map<number, U> {
  return new Map(
    items.map((t) => {
      if (t.id === undefined) {
        throw new Error(`given item ${t} without id`);
      }
      return [t.id, t];
    })
  );
}
