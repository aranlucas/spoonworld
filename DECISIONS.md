# Research and decisions

Spoonworld’s fantasy is being a curious naturalist in a kitchen: seven ordinary ingredients change a tiny place with roots and residents. The core loop is select → sprinkle on a patch → watch a local and global response → follow a field-guide clue → undo and compare. There are no deaths, scarce resources, payments, or accounts; the reward is discovering five understandable wonders.

## Precedents and primary sources

- [The Powder Toy’s official project site](https://powdertoy.co.uk/) describes a causal sandbox involving heat, pressure, and materials. The useful precedent is visible cause and effect. Spoonworld instead fixes a small ecology and gives reactions readable goals and inhabitants.
- [Little Alchemy 2’s official game](https://littlealchemy2.com/) makes everyday combinations into discoveries. Spoonworld attaches ingredients to spatial patches and continuous environmental state, so watering a salted grove can change its recovery rather than only checking a recipe pair.
- [Phaser’s Game documentation](https://docs.phaser.io/phaser/concepts/game) establishes the scene, renderer, and lifecycle boundary. The implementation uses one Canvas scene and keeps all saveable simulation state outside it. DOM buttons and dialogs carry instructions and accessibility semantics.
- [MDN’s service-worker guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) informed an install-time cache of the complete production build. Offline support is verified by a real browser network disconnect and reload, after the initial cache is ready.
- [MDN’s Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) informed suspending simulation and rendering for hidden tabs, avoiding background growth and expensive catch-up.

Sources were checked during implementation. These are design precedents and runtime references; the fictional ecology is not presented as a scientific model.

## Rule decisions

| Ingredient  | Local effect                        | Bowl-wide consequence                                  |
| ----------- | ----------------------------------- | ------------------------------------------------------ |
| Herbs       | Plant a patch and its neighbours    | Moist, lightly salted groves draw nesting sproutlings  |
| Water       | Moistens soil and rinses local salt | Cools air, adds moisture, dilutes brine                |
| Salt        | Stresses land plants at high doses  | Brine welcomes kelp and shell-boat sailors             |
| Chili       | A warming dose                      | Warm damp air makes a rain that waters all patches     |
| Sugar       | Sweetens growing herbs              | Flowering meadow invites glowbugs                      |
| Lemon       | Adds acidity to its patch           | Stores one side of a future reaction                   |
| Baking soda | Stores a quiet powder               | A sour patch makes fizz; residents ride bubble ferries |

The surprising pair consumes local acidity and soda, leaving a temporary bowl-wide fizz. Ingredient order is often flexible, but timing and location matter. Undo restores the whole state, so experiment comparisons are fair. Seeded terrain and a fixed tick produce deterministic results from the same actions at the same ticks. Visual motion never changes the simulation.

## Tradeoffs

The fixed 61-patch/12-resident ecology stays small and legible. Recipes are discoverable within a few minutes, and the guide provides hints from the first screen. Depth is deliberately limited: inhabitants change habitat preference, boat mode, or flying mode rather than running a large artificial-life system. Plants grow or wilt; none can permanently destroy the bowl.

Phaser contributes most of the roughly 334 kB gzipped JavaScript bundle. A future native Canvas-only edition could reduce this overhead; the current established runtime offers a predictable scene lifecycle and browser-safe renderer. There are no runtime network dependencies after the app is cached.

## Implemented follow-up: the naturalist’s notebook

The follow-up adds a readable patch notebook and twelve named residents. Native selects expose all 61 patches, seven measured local conditions, cause-based observations, ingredient placement, and exact Undo. This gives touch and keyboard users a second way to experiment with precise locations. The field guide’s resident notes explain current nesting, wandering, sailing, or bubble-ferry behaviour and link to each home patch.

Notes are deterministic functions of the existing state. The renderer, simulation, and notebook share one resident-mode rule, so a paused bowl’s new fizz is reflected immediately. There is no added save schema, ever-growing diary, or AI generation. Opening a notebook holds the ecology still, making before/after comparisons readable. Automated keyboard and axe checks cover these controls; a human screen-reader playtest is still a useful next step.

## Next useful experiments

1. Add a sixth discovery that depends on sequencing, such as a rain-watered salty grove becoming a miniature mangrove coast.
2. Offer split bowls with one shared seed to compare two recipes side by side.
3. Conduct a VoiceOver playtest of the patch notebook and resident notes, including live changes and focus restoration.
4. Add an optional two-minute illustrated recipe challenge without changing the open-ended sandbox.

These are follow-up experiments, not promises of implemented features.
