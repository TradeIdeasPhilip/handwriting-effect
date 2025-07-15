import { pickAny } from "phil-lib/misc";
import { PathShape } from "./path-shape";

/**
 * This is an older idea.
 * New code mostly focuses on the Font object, which now includes a lot of this information.
 */
export type FontMetrics = {
  /**
   * The height of a capital M.  1em in css.
   *
   * `mHeight` is often but not necessarily the requested font size.
   */
  readonly mHeight: number;
  /**
   * Put this much space between adjacent characters.
   */
  readonly defaultKerning: number;
  /**
   * The font reserves the space between `top` and `bottom` for itself.
   */
  readonly top: number;
  /**
   * The font reserves the space between `top` and `bottom` for itself.
   */
  readonly bottom: number;
  /**
   * The y coordinate for the top of most capital letters.
   */
  readonly capitalTop: number;
  /**
   * The expected stroke width.
   */
  readonly strokeWidth: number;
  /**
   * The recommended width for a normal space.
   */
  readonly spaceWidth: number;
  // baseLine is now frozen at 0!!!!!
};

export class DescriptionOfLetter {
  /**
   * Create a new `DescriptionOfLetter` object exactly like this one but with a different shape.
   * @param newShape Replace the existing shape with this.
   * @returns The new `DescriptionOfLetter` object.
   */
  reshape(newShape: PathShape) {
    return new DescriptionOfLetter(newShape, this.advance, this.fontMetrics);
  }
  readonly #shapeFactory: () => PathShape;
  get shape() {
    return this.#shapeFactory();
  }
  constructor(
    shape: PathShape | (() => PathShape),
    /**
     * How far to advance the print head after printing this character.
     * In SVG units.
     * Typically the "black" area of the character will start at x=0 and end at x=advance.
     */
    public readonly advance: number,
    public readonly fontMetrics: FontMetrics
  ) {
    if (shape instanceof PathShape) {
      this.#shapeFactory = () => shape;
    } else {
      this.#shapeFactory = shape;
    }
  }
  /**
   * This is in the right format for a lot of _css properties_.
   *
   * If you are planning to set the d _attribute_ of an element, use this.d instead.
   */
  get cssPath() {
    return this.shape.cssPath;
  }
  get d() {
    return this.shape.rawPath;
  }
  /**
   * Create a new element to draw this letter.
   * @returns This is always a <path> element.
   *
   * I considered making that a <g> element.
   * But see makeElements(), translate(), etc. instead.
   * The focus of this project is creating and
   * manipulating paths.
   */
  makeElement(): SVGPathElement {
    return this.shape.makeElement();
  }
  /**
   *
   * @returns One element per continuous part of the path.
   */
  makeElements() {
    return this.shape.splitOnMove().map((innerShape) => ({
      innerShape,
      element: innerShape.makeElement(),
    }));
  }
}

/**
 * Order is explicitly undefined.
 * The order is based on the most convenient implementation and is likely to change.
 *
 * This is aimed at older code.
 * This used to be called `Font` in a previous project.
 * See the new `Font` class for the preferred way of doing things.
 */
export type FontMap = Map<string, DescriptionOfLetter>;

export function resizeFont(originalFont: FontMap, newSize: number): FontMap {
  const newFont: FontMap = new Map();
  const originalFontMetrics = pickAny(originalFont)?.fontMetrics;
  if (originalFontMetrics) {
    const ratio = newSize / originalFontMetrics.mHeight;
    const newFontMetrics: FontMetrics = {
      bottom: ratio * originalFontMetrics.bottom,
      capitalTop: ratio * originalFontMetrics.capitalTop,
      defaultKerning: ratio * originalFontMetrics.defaultKerning,
      mHeight: ratio * originalFontMetrics.mHeight,
      spaceWidth: ratio * originalFontMetrics.spaceWidth,
      strokeWidth: ratio * originalFontMetrics.strokeWidth,
      top: ratio * originalFontMetrics.top,
    };
    const matrix = new DOMMatrix();
    matrix.scaleSelf(ratio);
    originalFont.forEach((originalLetter, key) => {
      if (originalLetter.fontMetrics != originalFontMetrics) {
        // Expecting all letters to come from the same font.
        throw new Error("wtf");
      }
      const newLetter = new DescriptionOfLetter(
        originalLetter.shape.transform(matrix),
        originalLetter.advance * ratio,
        newFontMetrics
      );
      newFont.set(key, newLetter);
    });
  }
  return newFont;
}

/**
 * This describes a strokable font in my own format.
 *
 * Almost all modern fonts are drawn by filling a path.
 * I'm interested in fonts that are drawn by stroking them.
 * Those allow for to all sorts of special effects, including:
 * https://tradeideasphilip.github.io/random-svg-tests/letters.html
 */
export class Font {
  constructor(
    /**
     * Everything between `top` and `bottom` is reserved for our text.
     * `top` is typically negative because the baseline is always 0.
     */
    readonly top: number,
    /**
     * Everything between `top` and `bottom` is reserved for our text.
     * This is relative to the baseline which is always 0.
     */
    readonly bottom: number,
    /**
     * How wide is the space character?
     *
     * The layout will typically use this information to set a minimum width,
     * rather than trying to draw the space like a normal letter.
     */
    readonly spaceWidth: number,
    /**
     * The recommended strokeWidth or lineWidth to use when stroking this font.
     * You can use any width you want.
     * (You don't even need to stroke the line at all; I've had good luck using css motion-path with these letters!)
     * But some fonts were built for a a specific size.
     * Look at the capital K.
     * Some fonts make the | and the < barely touch, which is only possible if you use a specific line width.
     */
    readonly strokeWidth: number,
    /**
     * The default amount of space to add after each letter.
     *
     * This can be adjusted but it should not be ignored.
     */
    readonly kerning: number,
    /**
     * A map from characters to DescriptionOfLetter objects.
     * More precisely, enough information to create our own initialized map.
     */
    letters: Iterable<readonly [string, DescriptionOfLetter]>
  ) {
    this.#letters = new Map(letters);
  }
  getWord(word: string): DescriptionOfLetter[] {
    // This could add special things, like kerning or ligatures.
    // That's not far off.  I had to manually tweak some of the cursive letters based on what came before them!
    const result: DescriptionOfLetter[] = [];
    for (const char of word) {
      const descriptionOfLetter = this.getChar(char);
      if (descriptionOfLetter) {
        result.push(descriptionOfLetter);
      }
    }
    return result;
  }
  #letters: Map<string, DescriptionOfLetter>;
  getChar(char: string): DescriptionOfLetter | undefined {
    return this.#letters.get(char);
  }
}
