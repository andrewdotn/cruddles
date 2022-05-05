// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { lazy } from "../fw/test/lazy";
import { ensureTestDb } from "../fw/test/db-setup";
import { resolve } from "path";
import { Server } from "../server";
import chai from "chai";
import chaiHttp from "chai-http";
import { Pbkdf2Config, User } from "../models/user";
import faker from "faker";
import { randomId } from "../fw/util";
import { JSDOM } from "jsdom";
import { i } from "../fw/i";
import { Task } from "../models/task";
import { TaskHistory } from "../models/task-history";
import { LocalDate } from "js-joda";
import { fakeClientNumber } from "../../cypress/support/utils";

chai.use(chaiHttp);

export async function createTestUser() {
  const username = faker.internet.userName();
  const password = faker.internet.password();
  console.log(`Creating test user ${username}`);

  const user = new User();
  user.username = username;
  user.active = true;
  user.salt = randomId();
  user.hashedPassword = await user.hashPassword(password);
  await user.save();
  return { user, password };
}

export function serverTestCrud() {
  const connection = lazy(() =>
    ensureTestDb({
      root: resolve(__dirname, "..", ""),
    })
  );

  const app = lazy(async () => {
    await connection();

    const server = new Server();
    server.exitOnException = true;
    return server.app;
  });

  const lazyAgent = lazy(
    async () => chai.request.agent(await app()),
    (createdAgent: ChaiHttp.Agent) => createdAgent.close()
  );

  type TestUserParams = {
    user: User;
    password: string;
  };

  const lazyTestUser = lazy(
    createTestUser,
    async ({ user }: TestUserParams) => {
      console.log(`Removing test user ${user.username}`);
      await user.remove();
    }
  );

  const loggedInSession = lazy(async () => {
    Pbkdf2Config.rounds = 1;

    const agent = await lazyAgent();
    const user = await lazyTestUser();

    await agent
      .post("/login")
      .type("form")
      .send({ username: user.user.username, password: user.password });
    const userInfo = (await agent.get("/userInfo.json")).body;
    if (!userInfo.loggedIn || userInfo.username !== user.user.username) {
      throw new Error(
        i`Login failed, test user=${user.user}, password=${
          user.password
        }, userInfo=${JSON.stringify(userInfo, null, 2)}`
      );
    }

    return { agent, user };
  });

  const loggedInEditorSession = lazy(async () => {
    const { agent, user } = await loggedInSession();
    user.user.isEditor = true;
    await user.user.save();
    return { agent, user };
  });

  const lazyTask = lazy(
    async () => {
      const t = new Task();
      t.subject = "task subject";
      t.body = "body blah blah";
      await t.save();
      return t;
    },
    async (t: Task) => {
      console.log(`Removing task history for ${t.id}`);
      await TaskHistory.delete({ taskId: t.id! });
      console.log(`Removing task ${t.id}`);
      await t.remove();
    }
  );

  return {
    connection,
    app,
    lazyAgent,
    lazyTask,
    lazyTestUser,
    loggedInSession,
    loggedInEditorSession,
  };
}

export function parseHtml(html: string): Document {
  const dom = new JSDOM(html);
  return dom.window.document;
}
