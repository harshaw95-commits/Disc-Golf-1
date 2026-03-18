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
2. Capture a **top view** with the disc and a known-width reference object in frame.
3. Mark the reference width, disc outer diameter, and inner rim break points.
4. Capture a **side view** with the same type of reference object in the disc's profile plane.
5. Mark the shoulder line, dome apex, bottom rim line, and left/right parting-line points.
6. Run the analysis to see calculated dimensions and a flight interpretation.

## Notes

- The app ships as static HTML, CSS, and JavaScript for easy hosting.
- Results are estimates and depend heavily on perspective control and annotation accuracy.
- Using the same distance and plane for the disc and reference object improves results significantly.
