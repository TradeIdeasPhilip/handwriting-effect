# Handwriting Effect

![Sample of the handwriting effect](./for_readme/Handwriting_Sample.gif)
The handwriting effect draws text on the screen as if you were writing with a pencil.

## Goal

Create bespoke animations in a web app.
Save them as videos with transparent backgrounds.

This will let anyone create a handwriting effect to add to their own videos.
The output of this program should work in most video editing programs.

## Status

I can create a video with the requested content!
I've tested the results in CapCut.
I've run it a lot to shake out the obvious bugs.

It could be useful to someone now.
But I want to add the fixed width mode and the second line before I seriously ask anyone to use this software.

## Second Line

I need a way to draw two copies of the text.

The GUI exists.
Now I have to implement it!

## Fixed width mode

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

## i, j, t and x

It would be amazing if we saved the dots and crosses until the end of the word.
More like a real human.
Seems very reasonable, especially since I already have a function for parsing one **word** at a time.
Only for the cursive font.

## Zoom

Need some sort of configurable zoom for the preview.

There are a few warnings in the code.
I should be able to zoom the canvas just by using css to change the size of the canvas.
But that might break the background, which should **not** resize when you zoom the image.

Also, when we zoom do we keep the pixelated feel?
That might be useful for debugging, so you can see exactly what you are getting.
However, it would be more realistic and it would look better if we used the default scaling, not the pixelated scaling.

When I tried this in the past I found that there is only one css property for setting the pixelated feel, and I've got it set to on or the background will fall apart, but that forces it to be on for normal scaling.
