import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
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
    extraResource: ["app-update.yml"],
  },
  hooks: {
    generateAssets: async () => {
      // Generate app-update.yml for electron-updater
      // Note: private: false means releases are public (repo can still be private)
      const updateConfig = `provider: github
owner: AnimeGate
repo: AG-SubEditor
private: false
updaterCacheDirName: ag_subeditor-updater
`;
      const outputPath = path.join(process.cwd(), "app-update.yml");
      fs.writeFileSync(outputPath, updateConfig, "utf8");
      console.log("✓ Generated app-update.yml");
    },
    postMake: async (forgeConfig, makeResults) => {
      // Generate latest.yml for electron-updater
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
      );
      const version = packageJson.version;

      // Find the Windows Squirrel artifacts
      for (const makeResult of makeResults) {
        if (makeResult.platform === "win32") {
          const nupkgFiles = makeResult.artifacts.filter((artifact) =>
            artifact.endsWith("-full.nupkg")
          );

          if (nupkgFiles.length > 0) {
            const nupkgFile = nupkgFiles[0];
            const nupkgFileName = path.basename(nupkgFile);
            const fileBuffer = fs.readFileSync(nupkgFile);
            const sha512 = crypto
              .createHash("sha512")
              .update(fileBuffer)
              .digest("base64");
            const fileSize = fs.statSync(nupkgFile).size;

            // Generate latest.yml content
            const latestYml = `version: ${version}
files:
  - url: ${nupkgFileName}
    sha512: ${sha512}
    size: ${fileSize}
path: ${nupkgFileName}
sha512: ${sha512}
releaseDate: '${new Date().toISOString()}'
`;

            // Write latest.yml to the same directory as the .nupkg file
            const outputDir = path.dirname(nupkgFile);
            const latestYmlPath = path.join(outputDir, "latest.yml");
            fs.writeFileSync(latestYmlPath, latestYml, "utf8");
            console.log(`✓ Generated latest.yml at ${latestYmlPath}`);

            // Add latest.yml to the artifacts list
            makeResult.artifacts.push(latestYmlPath);

            // Check if Update.exe exists and add it to artifacts
            const updateExePath = path.join(outputDir, "Update.exe");
            if (fs.existsSync(updateExePath)) {
              makeResult.artifacts.push(updateExePath);
              console.log(`✓ Added Update.exe to artifacts`);
            } else {
              console.warn(
                `⚠ Update.exe not found at ${updateExePath} - auto-update may not work correctly`
              );
            }
          }
        }
      }

      return makeResults;
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: "ag_subeditor",
      setupIcon: "./src/assets/icon.ico", // Optional: add your icon
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
