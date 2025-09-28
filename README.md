# Handwriting Effect

## Goal

Create bespoke animations in a web app.
Save them as videos with transparent backgrounds.

## Status

I can create a video with the requested content!
I've tested the results in CapCut.
I've run it a lot to shake out the obvious bugs.

It could be useful to someone now.
But I want to add the fixed width mode and the second line before I seriously ask anyone to use this software.

## TO DO

Choose:

- word wrap width, in pixels
- fps (currently hard coded to 30)
  - Or not.
  - Just document that it is 30 fps.
  - Any video editing software can adjust that, if necessary or desired.

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

Minimum GUI:

- Need the width for wrapping.
  - Regardless of any other settings.
- Fixed screen mode
  - You enter the width and height of the screen.
  - Buttons exist for "HD" and "4k".
  - A radio button requests this vs current behavior.
- Top and left margin stay as is regardless of anything.
- Right and bottom will change.
  - If you specify a size, the video will end exactly there.
  - Some things might get cut off.
  - Or the current behavior: size of the text + the margin.

# i, j, t and x

It would be amazing if we saved the dots and crosses until the end of the word.
More like a real human.
Seems very reasonable, especially since I already have a function for parsing one **word** at a time.
Only for the cursive font.
