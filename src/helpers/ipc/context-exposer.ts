import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposeFileContext } from "./file/file-context";
import { exposeDebugContext } from "./debug/debug-context";
import { exposeSettingsContext } from "./settings/settings-context";
import { exposeUpdaterContext } from "./updater/updater-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeFileContext();
  exposeDebugContext();
  exposeSettingsContext();
  exposeUpdaterContext();
}
