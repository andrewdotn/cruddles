import {execIfMain} from "execifmain";

async function main() {
    console.log("Hello, world.");
}

execIfMain(main, import.meta)
