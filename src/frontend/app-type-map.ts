// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { TypeMap } from "../fw/type-map";
import { SiteNav } from "../views/site-nav";
import { TaskList } from "./task-list";
import { TaskHistoryList } from "./task-history-list";
import { Input } from "../views/input";
import { TaskDetail } from "../views/task-detail";
import { TableForm } from "../fw/forms/table-form";
import { LinkToTask } from "../components/link-to-task";

let appTypeMap: TypeMap | undefined = undefined;

// This is wrapped in a function, because of a tricky-to-trace bug:
//
//     import { appTypeMap } from 'app-type-map';
//
//     function Foo {}
//
//     class Bar { }
//
// transpiles to
//
//     Object.defineProperty(exports, "__esModule", {
//       value: true
//     });
//     exports.Foo = Foo; // already exists because of hoisting
//     exports.Bar = void 0;
//
//     var _appTypeMap = require('app-type-map');
//
//     // <-- problem point
//
//     class Bar {}
//
//     Exports.Bar = Bar;
//
// At the problem point, the `Bar` export seen by `app-type-map` is `void 0` aka
// `undefined`. By moving map setup past require-time, we avoid these issues.
export function getAppTypeMap() {
  if (appTypeMap) {
    return appTypeMap;
  } else {
    appTypeMap = new TypeMap();
  }

  // React components which can be created on the server
  // and instantiated from JSON in the client browser.
  appTypeMap.register(TaskHistoryList, "4");
  appTypeMap.register(Input, "7");
  appTypeMap.register(SiteNav, "1");
  appTypeMap.register(TaskDetail, "8");
  appTypeMap.register(TaskList, "3");
  appTypeMap.register(LinkToTask, "2");
  appTypeMap.register(TableForm, "12");
  return appTypeMap;
}
