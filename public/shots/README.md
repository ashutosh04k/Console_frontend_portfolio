# Screenshot slots

Drop real product screenshots here to show them alongside the live demos.

Suggested files (any image format works):
- mapper.png       → the real bulk-import mapper UI
- tracking.png     → the real live tracking map
- dashboard.png    → the real ops dashboard
- shift.png        → the real shift scheduler

Then open `client/src/lib/caseStudies.js` and set the `shot` field for that
case study, e.g.:

    shot: "/shots/mapper.png",

The screenshot will appear under the live demo with a "from the real product"
caption. Tip: crop out anything confidential before adding.
