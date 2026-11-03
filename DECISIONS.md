# Design decisions

Spoonworld’s fantasy is being a curious naturalist in a kitchen. There are no deaths, scarce resources, payments, or accounts; the reward is discovering understandable wonders. The fixed-size ecology deliberately limits depth so ingredient effects stay legible. Plants can wilt, but a player cannot permanently destroy the bowl.

## Precedents

[The Powder Toy](https://powdertoy.co.uk/) provides a precedent for visible cause and effect, and [Little Alchemy 2](https://littlealchemy2.com/) for discoveries from everyday combinations. Spoonworld uses spatial patches and continuous conditions so experiments include recovery and timing, rather than only checking recipe pairs. These are design precedents, not scientific models for the fictional ecology.

## Reproducible experiments

Simulation state stays outside the renderer: the same seed and actions at the same ticks reproduce a world, while visual motion cannot change it. Whole-world Undo makes comparisons fair. Hidden tabs suspend the ecology instead of accumulating catch-up growth, so returning to a bowl does not invalidate the player’s experiment. The [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) supplies that lifecycle signal.

The patch notebook offers a precise text-based way to experiment alongside the canvas. Resident observations derive from current state and share travel-mode rules with the renderer. This avoids a separate diary state or generation service that could disagree with the bowl. Dialogs pause the ecology so readings remain stable while the player compares them.

## Runtime and assets

[Phaser](https://docs.phaser.io/phaser/concepts/game) provides an established scene lifecycle at the cost of engine bundle overhead. Native DOM controls and dialogs carry keyboard interaction and accessibility semantics around the visual bowl. Art, ingredient icons, sproutlings, bowl decoration, and sound were made for this project in code; no downloaded art or generated provider assets are used.

The production [service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) precaches the shipped app so play has no runtime network dependency after the initial cache is ready. This keeps the toy usable offline without accounts or a backend.
