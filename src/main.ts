import {
  assertNonNullable,
  count,
  initializedArray,
  makePromise,
  parseFloatX,
  zip,
} from "phil-lib/misc";
import "./style.css";
import { getById, selectorQuery, selectorQueryAll } from "phil-lib/client-misc";
import { FFmpeg } from "@ffmpeg/ffmpeg";

// https://github.com/ffmpegwasm/ffmpeg.wasm/issues/532#issuecomment-2014126657
import coreURL from "@ffmpeg/core?url";
import wasmURL from "@ffmpeg/core/wasm?url";
import { ParagraphLayout } from "./glib/paragraph-layout";
import { LineFontMetrics, makeLineFont } from "./glib/line-font";
import { EventBuffer } from "./util";

const previewCanvas = getById("preview", HTMLCanvasElement);
const context = assertNonNullable(previewCanvas.getContext("2d"));

function getImages(count: number) {
  return initializedArray(count, (n) => {
    const where = n / (count - 1);
    const x = where;
    const y = 1 - where;
    //drawAt(x, y);
    const promise = makePromise<Blob>();
    previewCanvas.toBlob((blob) => {
      if (blob) {
        promise.resolve(blob);
      } else {
        promise.reject(new Error("failed"));
      }
    });
    return promise.promise;
  });
}

async function showImages() {
  (await Promise.all(getImages(10))).forEach((blob) => {
    const url = URL.createObjectURL(blob);
    const img = document.createElement("img");
    img.classList.add("show-images");
    img.src = url;
    document.body.append(img);
  });
}

const load = async (ffmpeg: FFmpeg) => {
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm"; // Use ESM directory
  ffmpeg.on("log", ({ message }) => console.log("FFmpeg log:", message));
  ffmpeg.on("progress", ({ progress }) =>
    console.log("Load progress:", progress)
  );
  try {
    await ffmpeg.load({ coreURL, wasmURL });
    console.log("FFmpeg loaded successfully");
  } catch (error) {
    console.error("FFmpeg load failed:", error);
    throw error;
  }
};
async function createVideo() {
  const ffmpeg = new FFmpeg();
  await load(ffmpeg);
  for (const [blob, index] of zip(await Promise.all(getImages(10)), count())) {
    const number = (index + 1).toString().padStart(2, "0");
    const filename = `frame${number}.png`;
    ffmpeg.writeFile(filename, new Uint8Array(await blob.arrayBuffer()));
  }
  const status = await ffmpeg.exec([
    "-framerate",
    "30",
    "-i",
    "frame%02d.png",
    "-c:v",
    "prores_ks",
    "-pix_fmt",
    "yuva444p10le",
    "-y",
    "output.mov",
  ]);
  if (status !== 0) {
    throw new Error(`ffmpeg exec problem: ${status}`);
  }
  const data = await ffmpeg.readFile("output.mov");
  // Save to filesystem
  const blob = new Blob([data], { type: "video/quicktime" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "output.mov";
  a.click();
  URL.revokeObjectURL(url);
}

getById("createVideo", HTMLButtonElement).addEventListener(
  "click",
  createVideo
);

(window as any).showImages = showImages;

const fontSizeInput = getById("fontSize", HTMLInputElement);
const textTextArea = getById("text", HTMLTextAreaElement);
const strokeColorInput = getById("strokeColor", HTMLInputElement);
const lineWidthInput = getById("lineWidth", HTMLInputElement);
const durationInput = getById("duration", HTMLInputElement);
const recommendedLineWidthButton = getById(
  "recommendedLineWidth",
  HTMLButtonElement
);
const backgroundColorInput = getById("backgroundColor", HTMLInputElement);

class Hash {
  static #simpleValueElements: Pick<
    HTMLInputElement,
    "id" | "value" | "addEventListener"
  >[] = [
    fontSizeInput,
    textTextArea,
    strokeColorInput,
    lineWidthInput,
    backgroundColorInput,
  ];
  static #radioGroups: readonly string[] = ["alignment", "fontFamily"];
  static read() {
    const parameters = new URLSearchParams(location.hash.substring(1));
    this.#simpleValueElements.forEach((element) => {
      const requested = parameters.get(element.id);
      if (typeof requested === "string") {
        element.value = requested;
      }
    });
    this.#radioGroups.forEach((name) => {
      const requested = parameters.get(name);
      if (typeof requested === "string") {
        const elements = selectorQueryAll(
          `input[type="radio"][name="${name}"][value="${requested}"]`,
          HTMLInputElement
        );
        if (elements.length != 1) {
          console.warn("Expecting 1 radio button", elements, name, requested);
        } else {
          elements[0].checked = true;
        }
      }
    });
  }
  static #write() {
    const parameters = new URLSearchParams();
    this.#simpleValueElements.forEach((element) => {
      parameters.append(element.id, element.value);
    });
    this.#radioGroups.forEach((name) => {
      const value = selectorQuery(
        `input[type="radio"][name="${name}"]:checked`,
        HTMLInputElement
      ).value;
      parameters.append(name, value);
    });
    location.replace("#" + parameters.toString());
  }
  static readonly writeSoon = new EventBuffer(50, true, () => this.#write())
    .request;
  static init() {
    this.#simpleValueElements.forEach((element) => {
      element.addEventListener("input", this.writeSoon);
      selectorQueryAll('input[type="radio"]', HTMLInputElement).forEach(
        (element) => element.addEventListener("input", this.writeSoon)
      );
    });
  }
}
Hash.init();

let recommendedLineWidth = NaN;

recommendedLineWidthButton.addEventListener("click", () => {
  if (Number.isFinite(recommendedLineWidth)) {
    lineWidthInput.value = recommendedLineWidth.toString();
    updateSample();
    Hash.writeSoon();
  }
});

const errorDiv = getById("error", HTMLDivElement);
const lengthSpan = getById("length", HTMLSpanElement);
const progressInput = getById("progress", HTMLInputElement);

function updateSample() {
  try {
    errorDiv.style.display = "none";
    const fontSize = parseFloatX(fontSizeInput.value);
    const lineWidth = parseFloatX(lineWidthInput.value);
    const duration = parseFloatX(durationInput.value);
    (
      [
        [fontSize, fontSizeInput],
        [lineWidth, lineWidthInput],
        [duration, durationInput],
      ] as const
    ).forEach(([value, element]) => {
      element.style.backgroundColor = value === undefined ? "pink" : "";
    });
    if (
      fontSize === undefined ||
      lineWidth === undefined ||
      duration === undefined
    ) {
      return;
    }
    recommendedLineWidth = fontSize / 10; //TODO when the font changes, so will this rule.
    recommendedLineWidthButton.innerText = `Recommended: ${recommendedLineWidth}px`;
    const font = makeLineFont(new LineFontMetrics(fontSize, lineWidth));
    const layout = new ParagraphLayout(font);
    layout.addText(textTextArea.value);
    const alignment = selectorQuery(
      'input[type="radio"][name="alignment"]:checked',
      HTMLInputElement
    ).value;
    const width = fontSize * 25;
    const laidOut = layout.align(width, alignment as any);
    /**
     * 0.5em
     */
    const margin = (font.bottom - font.top) / 2;
    previewCanvas.width = width + 2 * margin;
    previewCanvas.height = laidOut.allRowMetrics.at(-1)!.bottom + 2 * margin;
    previewCanvas.style.width = `${previewCanvas.width / devicePixelRatio}px`;
    previewCanvas.style.height = `${previewCanvas.height / devicePixelRatio}px`;
    context.strokeStyle = strokeColorInput.value;
    context.lineWidth = lineWidth;
    //laidOut.drawAll(context, margin, margin);
    const partial = laidOut.drawPartial(margin, margin);
    lengthSpan.innerText = partial.totalLength.toString();
    partial.drawTo(progressInput.valueAsNumber * partial.totalLength, context);
  } catch (reason: unknown) {
    errorDiv.style.display = "";
    console.error(reason);
  }
}
Hash.read();
updateSample();
[textTextArea, ...selectorQueryAll("input", HTMLInputElement)].forEach(
  (element) => {
    element.addEventListener("input", updateSample);
  }
);
(window as any).updateSample = updateSample;

/**
 * Create or modify the checkerboard pattern behind the canvas.
 * @param baseColor Both halves of the checkerboard will have a color similar to this.
 * @param percentChange How close or distant the two colors should be from each other.
 */
function updateBackground(
  baseColor: string = backgroundColorInput.value,
  percentChange: number = 10
) {
  const whiterColor = `color-mix(in srgb-linear, ${baseColor} ${
    100 - percentChange
  }%, white ${percentChange}%)`;
  const blackerColor = `color-mix(in srgb-linear, ${baseColor} ${
    100 - percentChange
  }%, black ${percentChange}%)`;
  const checkerboardCanvas = document.createElement("canvas"); // Use document.createElement
  checkerboardCanvas.width = 2;
  checkerboardCanvas.height = 2;
  const checkerboardContext = checkerboardCanvas.getContext("2d")!;
  checkerboardContext.fillStyle = whiterColor;
  checkerboardContext.fillRect(0, 0, 2, 2); // Fill entire 2x2 with whiter
  checkerboardContext.fillStyle = blackerColor;
  checkerboardContext.fillRect(0, 1, 1, 1); // Bottom-left: blacker
  checkerboardContext.fillRect(1, 0, 1, 1); // Top-right: blacker
  const dataUrl = checkerboardCanvas.toDataURL("image/png");
  previewCanvas.style.background = `url(${dataUrl}) repeat`;
  previewCanvas.style.backgroundSize = "20px 20px"; // Scale to 10px per square (2x2 pattern)
  previewCanvas.style.imageRendering = "pixelated"; // Ensure crisp edges
}
updateBackground();
backgroundColorInput.addEventListener("input", () => updateBackground());

/**
 * TODO
 *
 * Import the Hershey fonts.
 * Fix the question marks.
 *
 * Make this runnable from the web.
 * I.e. publish to github pages.
 *
 * Multiple layers
 * - You should be able to add or remove a second layer with a single checkbox.
 * - It has its own color and width.
 * - The bottom layer is the optional one.
 * - The font is generated based on the larger line width.
 *
 * Animation for handwriting:
 * Use the slider to draw it at a specific position.
 * And some way to do a realtime animation.
 * This animation does not repeat.
 * In our sample animation, just stop at the end.
 * When saving this video file, also save the last frame as a png.
 * CapCut doesn't have any easy way to extend the last frame for an extended period of time.
 *
 * Second animation option:
 *
 * Animation for dancing lights:
 * Inputs:  How far apart to put the dots.
 * How much time for each dot to move to the next position.
 * That's the time for one cycle, and that's all that we will need to record because it will play in a loop.
 * Keep this file small because we are in a web app; let the video production software create the loop.
 * We want to round this to an integer number of frames; maybe use a drop down list?
 *
 *
 * Add a zoom control.
 * The checkerboard does not resize.
 * How?
 * Seems simple, just set the css width and height to the scale factor times the actual size of the canvas.
 * Snap to some reasonable values.  Maybe an <option> with only predefined values.
 * Always include pixel perfect as an option.
 * 100% means one css pixel per real pixel, the default if I didn't specify anything.
 *
 * What about the image-rendering: pixelated; property?
 * Removing that will make the checkerboard look bad.
 * Keeping it might make the content look less than ideal?
 * Try it and see.
 * If it's a problem, create a container div,
 * set the size and background of that div the way we've been configuring the canvas.
 * Put the canvas inside the div.
 * use css to make the canvas full size, maybe width:100%
 *
 * Manually set the size of both the canvas and the div.  Normally they will be the same.  But maybe the div has a max width and a scroll bar.
 */

/**
 * TODO
 *
 * The main program should ask for the width and default to infinite.
 * For testing.
 * And to make smaller things where I don't have to scroll past the blank parts.
 * Add a check box, then "wrap at:" and then an input for the width.
 * Changing the width automatically checks the checkbox.
 * unchecking the box changes the margin to infinity.
 */
