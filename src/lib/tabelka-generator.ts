/**
 * ASS Table Generator
 * Ported from Java implementation (AG-Table.jar)
 *
 * Generates ASS dialogue lines for decorative table overlays
 * commonly used in anime fansub releases.
 */

export interface TabelkaConfig {
  width: number;
  height: number;
  side: "left" | "right";
  title: string;
  content: string;
  description: string;
  groupName: string;
}

/**
 * ASS template with placeholders for dynamic values
 * Contains 5 dialogue lines: BG, Border, Title, Content, DSC
 */
const ASS_TEMPLATE = String.raw`Dialogue: 0,0:00:00.00,0:00:15.00,AnimeGate,Tabelka - %SIDE% - %GROUP% - BG,0,0,0,,{\an5 \fscx%CX%\fscy%CY% \pos(%PX%, %PY%) \1c&HE5F8FD&\1a&H80&\3a&HFF&\shad0\p1\fade(255,0,255,0,1000,14000,15000)}m 450 7.5 b 313.3 7.5 40 20 40 20 b 40 20 29.7 20.3 25 25 b 20.3 29.7 20 40 20 40 l 17.5 300 l 20 560 b 20 560 20.3 570.3 25 575 b 29.7 579.7 40 580 40 580 b 40 580 313.3 592.5 450 592.5 b 586.7 592.5 860 580 860 580 b 860 580 870.3 579.7 875 575 b 879.7 570.3 880 560 880 560 b 880 560 882.5 386.7 882.5 300 b 882.5 213.3 880 40 880 40 b 880 40 879.7 29.7 875 25 b 870.3 20.3 860 20 860 20 b 860 20 586.7 7.5 450 7.5 {\p0}
Dialogue: 0,0:00:00.00,0:00:15.00,AnimeGate,Tabelka - %SIDE% - %GROUP% - Border,0,0,0,,{\an5 \fscx%CX%\fscy%CY% \pos(%PX%, %PY%) \1c&H522E2A&\1a&H3F&\3a&HFF&\shad0\p1\fade(255,0,255,0,1000,14000,15000)}m 450 7.5 b 313.3 7.5 40 20 40 20 b 40 20 29.7 20.3 25 25 b 20.3 29.7 20 40 20 40 l 17.5 300 l 20 560 b 20 560 20.3 570.3 25 575 b 29.7 579.7 40 580 40 580 b 40 580 313.3 592.5 450 592.5 b 586.7 592.5 860 580 860 580 b 860 580 870.3 579.7 875 575 b 879.7 570.3 880 560 880 560 b 880 560 882.5 386.7 882.5 300 b 882.5 213.3 880 40 880 40 b 880 40 879.7 29.7 875 25 b 870.3 20.3 860 20 860 20 b 860 20 586.7 7.5 450 7.5 m 450 32.5 b 585 32.5 855 45 855 45 b 855 45 865.3 45.3 870 50 b 874.7 54.7 875 65 875 65 b 875 65 877.5 215 877.5 300 b 877.5 385 875 535 875 535 b 875 535 874.7 545.3 870 550 b 865.3 554.7 855 555 855 555 b 855 555 585 567.5 450 567.5 b 315 567.5 45 555 45 555 b 45 555 34.7 554.7 30 550 b 25.3 545.3 25 535 25 535 l 22.5 300 l 25 65 b 25 65 25.4 54.7 30.1 50 b 34.8 45.3 45 45 45 45 b 45 45 315 32.5 450 32.5 m 755 140 b 759.7 135.3 760 125 760 125 l 760 95 b 760 95 759.7 84.7 755 80 b 750.3 75.3 740 75 740 75 b 740 75 513 80.1 450 80 b 387 79.9 160 75 160 75 b 160 75 149.7 75.3 145 80 b 140.3 84.7 140 95 140 95 l 140 125 b 140 125 140.3 135.3 145 140 b 149.7 144.7 160 145 160 145 l 165 145 b 165 145 154.7 144.7 150 140 b 145.3 135.3 145 125 145 125 l 145 100 b 145 100 145.3 89.7 150 85 b 154.7 80.3 165 80 165 80 b 165 80 387 84.9 450 85 b 513 85.1 735 80 735 80 b 735 80 745.3 80.3 750 85 b 754.7 89.7 755 100 755 100 l 755 125 b 755 125 754.7 135.3 750 140 b 746.1 143.9 735 145 735 145 l 740 145 b 740 145 750.3 144.7 755 140 m 60 180 l 840 180 b 840 180 580 170 450 170 b 320 170 60 180 60 180 m 60 490 l 840 490 b 840 490 580 500 450 500 b 320 500 60 490 60 490 {\p0}
Dialogue: 0,0:00:00.00,0:00:15.00,AnimeGate,Tabelka - %SIDE% - %GROUP% - Title,0,0,0,,{\an5 \fscx%CX%\fscy%CY% \pos(%PX%, %PY1%) \fade(255,0,255,0,1000,14000,15000) \bord2} %TITLE%
Dialogue: 0,0:00:00.00,0:00:15.00,AnimeGate,Tabelka - %SIDE% - %GROUP% - Content,0,0,0,,{\an5 \fscx%CX%\fscy%CY% \pos(%PX%, %PY2%) \clip(%CL%, %CT%, %CR%, %CB%) \fade(255,0,255,0,1000,14000,15000)\bord2} %CONTENT%
Dialogue: 0,0:00:00.00,0:00:15.00,AnimeGate,Tabelka - %SIDE% - %GROUP% - DSC,0,0,0,,{\an5 \fscx%CX%\fscy%CY% \pos(%PX%, %PY3%) \fade(255,0,255,0,1000,14000,15000) \bord2} %DSC%`;

/**
 * Format a number with up to 2 decimal places (US locale style)
 */
function formatNumber(value: number): string {
  // Remove trailing zeros and unnecessary decimal point
  return value.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * Calculate all scaled values based on resolution and side
 */
export interface ScaledValues {
  scaleX: string;
  scaleY: string;
  posX: string;
  posY: string;
  posY1: string;
  posY2: string;
  posY3: string;
  posYTop: string;
  posYBottom: string;
  clipLeft: string;
  clipTop: string;
  clipRight: string;
  clipBottom: string;
}

export function calculateScaledValues(
  width: number,
  height: number,
  isRight: boolean
): ScaledValues {
  // Base resolution constants (from Java)
  const baseWidth = 1920;
  const baseHeight = 1080;

  // Calculate scale factor
  const scale = height / baseHeight;

  // Calculate width difference for positioning
  const widthDiff = baseWidth - width / scale;

  // Base position values (from Java source)
  const baseScaleX = 60;
  const baseScaleY = 60;
  const basePosX = isRight ? 1630 - widthDiff : 270;
  const basePosY = 880;
  const basePosY1 = 780; // Title Y position
  const basePosY2 = 900; // Content Y position
  const basePosY3 = 1020; // Description Y position
  const basePosYTop = 1200; // For scrolling content top
  const basePosYBottom = 700; // For scrolling content bottom

  // Clip rectangle base values
  const baseClipLeft = isRight ? 1360 - widthDiff : 0;
  const baseClipTop = 810;
  const baseClipRight = isRight ? 1920 - widthDiff : 560;
  const baseClipBottom = 1000;

  return {
    scaleX: formatNumber(baseScaleX * scale),
    scaleY: formatNumber(baseScaleY * scale),
    posX: formatNumber(basePosX * scale),
    posY: formatNumber(basePosY * scale),
    posY1: formatNumber(basePosY1 * scale),
    posY2: formatNumber(basePosY2 * scale),
    posY3: formatNumber(basePosY3 * scale),
    posYTop: formatNumber(basePosYTop * scale),
    posYBottom: formatNumber(basePosYBottom * scale),
    clipLeft: formatNumber(baseClipLeft * scale),
    clipTop: formatNumber(baseClipTop * scale),
    clipRight: formatNumber(baseClipRight * scale),
    clipBottom: formatNumber(baseClipBottom * scale),
  };
}

/**
 * Convert real newlines to ASS newline format (\\N)
 * Also normalizes existing \\N sequences
 */
function convertToAssNewlines(text: string): string {
  return text
    .replace(/\r\n/g, "\\N") // Windows newlines
    .replace(/\n/g, "\\N") // Unix newlines
    .replace(/\r/g, "\\N"); // Old Mac newlines
}

/**
 * Generate the ASS dialogue lines for a table
 */
export function generateTabelka(config: TabelkaConfig): string {
  const isRight = config.side === "right";
  const scaled = calculateScaledValues(config.width, config.height, isRight);

  // Convert real newlines to ASS format
  const title = convertToAssNewlines(config.title);
  const content = convertToAssNewlines(config.content);
  const description = convertToAssNewlines(config.description);

  let result = ASS_TEMPLATE;

  // Handle special case: if content contains \move(), remove \pos from content line
  if (content.includes("\\move(")) {
    result = result.replace("\\pos(%PX%, %PY2%)", "");
    result = result.replace("}{", " ");
  }

  // Replace all placeholders
  result = result
    .replace(/%CX%/g, scaled.scaleX)
    .replace(/%CY%/g, scaled.scaleY)
    .replace(/%PX%/g, scaled.posX)
    .replace(/%PY%/g, scaled.posY)
    .replace(/%PY1%/g, scaled.posY1)
    .replace(/%PY2%/g, scaled.posY2)
    .replace(/%PY3%/g, scaled.posY3)
    .replace(/%PY-T%/g, scaled.posYTop)
    .replace(/%PY-B%/g, scaled.posYBottom)
    .replace(/%CL%/g, scaled.clipLeft)
    .replace(/%CT%/g, scaled.clipTop)
    .replace(/%CR%/g, scaled.clipRight)
    .replace(/%CB%/g, scaled.clipBottom)
    .replace(/%SIDE%/g, isRight ? "RIGHT" : "LEFT")
    .replace(/%GROUP%/g, config.groupName)
    .replace(/%TITLE%/g, title)
    .replace(/%CONTENT%/g, content)
    .replace(/%DSC%/g, description);

  return result;
}

/**
 * Strip ASS tags from text for display purposes
 */
export function stripAssTags(text: string): string {
  // Remove all {...} blocks
  return text.replace(/\{[^}]*\}/g, "").trim();
}

/**
 * Extract plain text content from ASS-styled text
 * Useful for preview display
 */
export function extractPlainText(assText: string): string {
  return stripAssTags(assText)
    .replace(/\\N/g, "\n") // Convert ASS newlines to actual newlines
    .replace(/\\n/g, "\n")
    .replace(/\\h/g, " "); // Convert hard space to regular space
}
