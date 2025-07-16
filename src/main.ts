import {
  assertNonNullable,
  count,
  FULL_CIRCLE,
  initializedArray,
  lerp,
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

const previewCanvas = getById("preview", HTMLCanvasElement);
const context = assertNonNullable(previewCanvas.getContext("2d"));

const BOX_SIZE = 100;
const RADIUS = 5;

previewCanvas.width = BOX_SIZE;
previewCanvas.height = BOX_SIZE;

function drawAt(x: number, y: number) {
  x = lerp(RADIUS, BOX_SIZE - RADIUS, x);
  y = lerp(RADIUS, BOX_SIZE - RADIUS, y);
  context.clearRect(0, 0, BOX_SIZE, BOX_SIZE);
  context.beginPath();
  context.ellipse(x, y, RADIUS, RADIUS, 0, 0, FULL_CIRCLE);
  context.fillStyle = "#c4e2e4";
  context.fill();
}

function getImages(count: number) {
  return initializedArray(count, (n) => {
    const where = n / (count - 1);
    const x = where;
    const y = 1 - where;
    drawAt(x, y);
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
    /*
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ), // Correct ESM path
    });
    */
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

(window as any).drawAt = drawAt;
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

let recommendedLineWidth = NaN;

recommendedLineWidthButton.addEventListener("click", () => {
  if (Number.isFinite(recommendedLineWidth)) {
    lineWidthInput.value = recommendedLineWidth.toString();
    updateSample();
  }
});

function updateSample() {
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
  console.log(font, laidOut);
  previewCanvas.width = width;
  previewCanvas.height = laidOut.allRowMetrics.at(-1)!.bottom;
  previewCanvas.style.width = `${previewCanvas.width / devicePixelRatio}px`;
  previewCanvas.style.height = `${previewCanvas.height / devicePixelRatio}px`;
  // todo margin : 0.5em
  context.strokeStyle = strokeColorInput.value;
  context.lineWidth = lineWidth;
  laidOut.drawAll(context);
}
updateSample();
[textTextArea, ...selectorQueryAll("input", HTMLInputElement)].forEach(
  (element) => {
    element.addEventListener("input", updateSample);
  }
);
(window as any).updateSample = updateSample;
