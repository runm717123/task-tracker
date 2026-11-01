// vitest.config.ts
import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";

export default defineConfig({
  plugins: [WxtVitest(), svelte({ configFile: false }), svelteTesting()],
  resolve: {
    alias: [
      // WXT's browser mock only needs fakeBrowser, not the testing barrel's build tooling.
      { find: /^wxt\/testing$/, replacement: "wxt/testing/fake-browser" },
    ],
  },
});
