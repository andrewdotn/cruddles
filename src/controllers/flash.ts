// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Request } from "express";
import { FlashItem } from "../server";

export function addFlash(req: Request, item: string | FlashItem) {
  req.session!.flash = req.session?.flash ?? [];

  let pushItem: FlashItem;
  if (typeof item === "string") {
    pushItem = {
      variant: "secondary",
      dangerouslySetHtmlContent: item,
    };
  } else {
    pushItem = item;
  }

  req.session!.flash.push(pushItem);
}
