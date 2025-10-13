export const FFMPEG_CHANNELS = {
  START_PROCESS: "ffmpeg:start",
  CANCEL_PROCESS: "ffmpeg:cancel",
  PROGRESS_UPDATE: "ffmpeg:progress",
  LOG_OUTPUT: "ffmpeg:log",
  PROCESS_COMPLETE: "ffmpeg:complete",
  PROCESS_ERROR: "ffmpeg:error",
  SELECT_VIDEO_FILE: "ffmpeg:selectVideo",
  SELECT_SUBTITLE_FILE: "ffmpeg:selectSubtitle",
  SELECT_OUTPUT_PATH: "ffmpeg:selectOutput",
  CHECK_GPU: "ffmpeg:checkGpu",
  OPEN_OUTPUT_FOLDER: "ffmpeg:openOutputFolder",
} as const;
