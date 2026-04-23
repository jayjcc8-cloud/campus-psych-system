import path from "node:path";

import { defineConfig } from "@tarojs/cli";

const workspaceRoot = path.resolve(__dirname, "../../../");
const taroSharedEntry = path.resolve(
  workspaceRoot,
  "node_modules/.pnpm/node_modules/@tarojs/shared/dist/index.cjs.js"
);
const taroRuntimeEntry = path.resolve(
  workspaceRoot,
  "apps/miniapp/node_modules/@tarojs/runtime/dist/runtime.esm.js"
);

export default defineConfig({
  projectName: "campus-psych-miniapp",
  date: "2026-04-19",
  sourceRoot: "src",
  outputRoot: "dist",
  framework: "react",
  alias: {
    "@tarojs/shared": taroSharedEntry,
    "@tarojs/runtime": taroRuntimeEntry
  },
  compiler: {
    type: "webpack5"
  },
  copy: {
    patterns: [
      {
        from: "src/custom-tab-bar",
        to: "dist/custom-tab-bar"
      }
    ],
    options: {}
  },
  mini: {},
  h5: {}
});
