# Handwriting Effect

## Goal

Create bespoke animations in a web app.
Save them as videos with transparent backgrounds.

## Status

This proof of concept works!

I can create frames in a canvas then use FFMPEG to turn them into a video file.
I can do this in a web app and it will download the result.

## TO DO

Post a compiled version to github pages.
Currently it only works if you build it yourself.

Add in better graphics.

Start with the handwriting effect.

Choose:

- One of the 3 fonts, they already exist.
- the text, one paragraph at a time.
- font size in pixels
- document width, in pixels
- alignment,
- fps
- duration.

You might get one or more lines. Each has some choices:

- Thickness. The default will depend on the font and the font size.
- Color.
- Time offset. Maybe the thicker line in the back starts first.
