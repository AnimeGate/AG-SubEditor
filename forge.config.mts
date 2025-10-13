import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerWix } from "@electron-forge/maker-wix";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { PublisherGithub } from "@electron-forge/publisher-github";
import * as fs from "fs";
import * as path from "path";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    appBundleId: "com.animegate.ag-subeditor",
    icon: "./src/assets/icon",
    extraResource: ["app-update.yml"],
  },
  hooks: {
    generateAssets: async () => {
      // Generate app-update.yml for electron-updater
      const updateConfig = `provider: github
owner: AnimeGate
repo: AG-SubEditor
private: false
`;
      const outputPath = path.join(process.cwd(), "app-update.yml");
      fs.writeFileSync(outputPath, updateConfig, "utf8");
      console.log("✓ Generated app-update.yml");
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerWix({
      name: "AG-SubEditor",
      description: "Professional ASS subtitle editor",
      manufacturer: "AnimeGate",
      version: "1.1.6",
      appDirectory: "", // Will be set by Electron Forge
      ui: {
        chooseDirectory: true, // Allow users to choose install location
      },
      icon: "./src/assets/icon.ico",
      language: 1033, // English
      shortcuts: {
        programMenu: true,
        desktop: true,
        startMenu: true,
      },
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "AnimeGate",
        name: "AG-SubEditor",
      },
      prerelease: false,
      draft: true,
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.mts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.mts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mts",
        },
      ],
    }),

    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
