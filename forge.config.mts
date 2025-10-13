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
import * as crypto from "crypto";

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
    postMake: async (forgeConfig, makeResults) => {
      // Generate latest.yml for electron-updater (MSI installer)
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
      );
      const version = packageJson.version;

      // Find the Windows MSI artifacts
      for (const makeResult of makeResults) {
        if (makeResult.platform === "win32") {
          const msiFiles = makeResult.artifacts.filter((artifact) =>
            artifact.endsWith(".msi")
          );

          if (msiFiles.length > 0) {
            const msiFile = msiFiles[0];
            const msiFileName = path.basename(msiFile);
            const fileBuffer = fs.readFileSync(msiFile);
            const sha512 = crypto
              .createHash("sha512")
              .update(fileBuffer)
              .digest("base64");
            const fileSize = fs.statSync(msiFile).size;

            // Generate latest.yml content for MSI
            const latestYml = `version: ${version}
files:
  - url: ${msiFileName}
    sha512: ${sha512}
    size: ${fileSize}
path: ${msiFileName}
sha512: ${sha512}
releaseDate: '${new Date().toISOString()}'
`;

            // Write latest.yml to the same directory as the .msi file
            const outputDir = path.dirname(msiFile);
            const latestYmlPath = path.join(outputDir, "latest.yml");
            fs.writeFileSync(latestYmlPath, latestYml, "utf8");
            console.log(`✓ Generated latest.yml at ${latestYmlPath}`);

            // Add latest.yml to the artifacts list for GitHub upload
            makeResult.artifacts.push(latestYmlPath);
          }
        }
      }

      return makeResults;
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerWix({
      name: "AG-SubEditor",
      description: "Professional ASS subtitle editor",
      manufacturer: "AnimeGate",
      version: "1.1.8",
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
