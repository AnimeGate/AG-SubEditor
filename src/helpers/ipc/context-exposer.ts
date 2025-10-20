import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposeFileContext } from "./file/file-context";
import { exposeFfmpegContext } from "./ffmpeg/ffmpeg-context";
import { exposeDebugContext } from "./debug/debug-context";
import { exposeSettingsContext } from "./settings/settings-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeFileContext();
  exposeFfmpegContext();
  exposeDebugContext();
  exposeSettingsContext();
}
