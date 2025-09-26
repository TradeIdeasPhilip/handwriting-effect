# Handwriting Effect

## Goal

Create bespoke animations in a web app.
Save them as videos with transparent backgrounds.

## Status

This proof of concept works!

I can create frames in a canvas then use FFMPEG to turn them into a video file.
These are the same frames that I see in the preview.
I can do this in a web app and it will download the result.

## TO DO

Choose:

- One of the 3 fonts, they already exist.
- font size in pixels
- document width, in pixels
- alignment
  - mostly working,
  - but I don't like it when I add a hard return in justify mode.
  - that should force that line to be left justified.
  - The return means that you are creating multiple paragraphs.
- fps (currently hard coded to 30)

You get one or two lines. Each has some choices:

- Thickness. The default will depend on the font and the font size.
- Color.
- Alpha.
- Time offset. Maybe the thicker line in the back starts first.

Need some sort of configurable zoom for the preview.
