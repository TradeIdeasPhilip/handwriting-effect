/**
 * Collect multiple events into a single call to the event handler.
 *
 * A lot of graphics stuff already does this automatically.
 * Your change gets logged immediately.
 * But the real work isn't done until the next frame.
 * Then multiple requests might be handled at once.
 *
 * I had to create this because of `location.replace()`.
 * I had an `<input type="color">` that was setting `location.hash` on every `"input"` event.
 * That caused lots of warnings in my log.
 * Switching to `location.replace()` reduced the number of warnings, and made my history less messy.
 * But that change was not sufficient to eliminate the warnings.
 */
export class EventBuffer {
  /**
   *
   * @param delayMS Wait this long before performing the action.
   * @param cumulative If true, wait this long after the last event, so the wait might go on for a long time.
   * If false, ignore any new requests while an action is already pending, so in busy times we will perform the action at a frequency of 1/delayMS.
   * True is like hitting the walk button and expecting to see a walk like in a fixed maximum amount of time, maybe sooner if someone already hit it before you got there.
   * False is when someone is clearly unable to make up their mind, and there is no desire to start any work until they do.
   * @param action Call this action after one or more calls to this.request(), after an appropriate delay.
   */
  constructor(
    readonly delayMS: number,
    readonly cumulative: boolean,
    private readonly action: () => void
  ) {
    this.request = this.request.bind(this);
  }
  /**
   * Only one action can be pending at a time.
   */
  #actionPending = false;
  /**
   * If multiple requests apply to the same action,
   * *and* `this.cumulative`,
   * then `#lastRequestTime` is the time of the last request.
   *
   * In all other circumstances `#lastRequestTime` is NaN.
   *
   * This is something of an optimization.
   * I've had trouble in the past.
   * The other implementation would be to cancel the pending timer and create a new one from scratch.
   */
  #lastRequestTime = NaN;
  /**
   * Create a new timer.
   *
   * This might be a fresh new request.
   * Or a timer might have expired and it's not done so it calls this to restart.
   */
  #createTimer() {
    const waitTime = isNaN(this.#lastRequestTime)
      ? this.delayMS
      : this.delayMS - (performance.now() - this.#lastRequestTime);
    this.#actionPending = true;
    this.#lastRequestTime = NaN;
    setTimeout(() => {
      if (isFinite(this.#lastRequestTime)) {
        // Someone asked to continue waiting, while we were already waiting.
        // Now create a new timer to wait for the remaining time.
        this.#createTimer();
      } else {
        // Done waiting!
        this.#actionPending = false;
        this.action();
      }
    }, waitTime);
  }
  /**
   * Request that the action be performed in some timely fashion.
   */
  request() {
    if (this.#actionPending) {
      if (this.cumulative) {
        this.#lastRequestTime = performance.now();
      }
    } else {
      this.#createTimer();
    }
  }
}
