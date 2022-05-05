// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { spawn, SpawnOptionsWithoutStdio } from "child_process";
import { series, parallel } from "./gulp-settled";
import del from "del";

function run(command: string[], options?: SpawnOptionsWithoutStdio) {
  return spawn(command[0], command.slice(1), { stdio: "inherit", ...options });
}

// prettier

const filesToPretty = [
  "deploy",
  "*.js",
  "*.ts",
  ".storybook/*.js",
  "*.json",
  "src/**/*.{ts,tsx,css}",
];

export function prettierCheck() {
  return run(["prettier", "--check", ...filesToPretty]);
}

export function prettier() {
  return run(["prettier", "--list-different", "--write", ...filesToPretty]);
}

// test

const testFiles = ["src/**/*-test.ts", "src/**/*-test.tsx"];

export function unitTest() {
  return run(["mocha", "-r", "./babel-register", ...testFiles]);
}

export function tsc() {
  return run(["tsc"]);
}

export function cypressTsc() {
  return run(["tsc"], { cwd: "cypress" });
}

export function cypress() {
  return run(["node", "-r", "./babel-register", "run-cypress.ts"]);
}

export function audit() {
  return run(["yarn", "audit"]);
}

export const allTsc = parallel(tsc, cypressTsc);

export const test = parallel(
  prettierCheck,
  tsc,
  cypressTsc,
  unitTest,
  cypress
  audit
);

export function coverage() {
  return run([
    "c8",
    "--reporter=text",
    "--reporter=html",
    "--exclude=src/migrations",
    "mocha",
    "-r",
    "./babel-register",
    "--exclude=node_modules/**",
    ...testFiles,
  ]);
}

// build

export function clean() {
  return del(["lib/**/*", "dist/**/*"], { dot: true });
}

export function babel() {
  return run(["babel", "-x", ".ts,.tsx", "-d", "lib", "src"]);
}

export function parcel() {
  return run([
    "parcel",
    "build",
    "--no-autoinstall",
    "--no-source-maps",
    "--public-url=/dist",
    "src/frontend/login.css",
    "src/frontend/.wrapper.html",
  ]);
}

export const build = series(clean, parallel(babel, parcel));
