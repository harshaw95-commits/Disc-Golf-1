# Disc Flight Lab

Disc Flight Lab is a lightweight browser app that uses a device camera plus manual image annotations to estimate a disc golf disc's:

- outer rim diameter,
- rim width,
- dome height, and
- parting line height (PLH).

From those measurements, the app produces a heuristic flight-profile summary that estimates likely speed, glide, turn, fade, and overall stability.

## How to run

Because camera access requires a browser context that supports `getUserMedia`, serve the project with a local web server such as:

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173> in a modern mobile or desktop browser.

## Measurement workflow

1. Start the rear-facing camera.
2. Choose the **top view tool** or **side view tool** in the live camera panel.
3. Drag the on-screen measuring calipers over your known-width reference and the disc feature you want to frame.
4. Capture a **top view** with the disc and reference object in frame.
5. Capture a **side view** with the same type of reference object in the disc's profile plane.
6. Annotate the captured images and run the analysis to see the calculated dimensions and heuristic flight interpretation.

## Notes

- The app ships as static HTML, CSS, and JavaScript for easy hosting.
- The live measuring tools are framing aids; the final geometry still comes from the captured-image annotations.
- Results are estimates and depend heavily on perspective control and annotation accuracy.
- Using the same distance and plane for the disc and reference object improves results significantly.
