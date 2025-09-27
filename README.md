# Handwriting Effect

## Goal

Create bespoke animations in a web app.
Save them as videos with transparent backgrounds.

## Status

This proof of concept works!

I can create a video with the requested content!
I've tested the results in CapCut.

## TO DO

Choose:

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

# Fixed width mode

I tried the result of this program in CapCut.
It worked.
But there was one annoying thing:
CapCut blew the clip up to be as big as possible where it would fit on the screen.
And it calls that "100%".
I could resize things, but I'd have to know the right amount.

Ideally CapCut would keep the pixel sizes right.
If you choose to resize the clip, it should be relative to the initially requested size.

Proposed solution:
Change my output size to match the video you are editing.
Ask you where you want to put your text within that area.
The background is still transparent, so this should not take any (significant) extra resources.
And you can still slide or otherwise transform the text.

Not hard to do.
Almost all GUI.
Probably need this to be an option and the current way to be another option.

# Status window

While the thing is working we don't display any status.  
We need to.
We can display the ffmpeg messages, which are in currently being shown in the console.
And we know which frame number we are encoding.
