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
3. Drag the on-screen measuring calipers over the same reference and disc edges you want automatically seeded into the captured measurement.
4. Capture a **top view** with the disc and reference object in frame; the app seeds the reference span and disc outer-edge span.
5. Capture a **side view** with the same type of reference object in the disc's profile plane; the app seeds the reference, shoulder, bottom-rim, and parting-line spans.
6. Finish any remaining annotations and run the analysis to see the calculated dimensions and heuristic flight interpretation.

## Notes

- The app ships as static HTML, CSS, and JavaScript for easy hosting.
- The live measuring tools now seed matching capture points so the live view and captured annotation workflow stay aligned.
- Results are estimates and depend heavily on perspective control and annotation accuracy.
- Using the same distance and plane for the disc and reference object improves results significantly.
