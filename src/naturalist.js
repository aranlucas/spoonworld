import { residentMode } from "./simulation.js";

const NAMES = [
  "Pip",
  "Basil",
  "Miso",
  "Clover",
  "Poppy",
  "Nori",
  "Crumb",
  "Saffron",
  "Fennel",
  "Bramble",
  "Juniper",
  "Mochi",
];

export const residentName = (resident) => NAMES[resident.id];

export const patchName = (cell) =>
  `Patch ${cell.id + 1} · ${cell.land ? "meadow" : "sea"} (${cell.q}, ${cell.r})`;

// Observations are derived from the same current state as the artwork. No new
// save fields, history, random names, or generated text are needed.
export function residentObservation(world, resident) {
  const mode = residentMode(world, resident);

  if (mode === "flying")
    return "Riding a bubble ferry: lemon and soda made enough fizz for a lift.";

  if (mode === "sailing")
    return "Sailing a shell boat: this sproutling takes to the sea when brine reaches 30%.";

  if (mode === "nesting")
    return "Nesting among the herbs: this patch has more than 45% leafy cover.";

  return "Wandering between meadows, looking for leafy, moist ground with less salt.";
}

export function patchObservation(world, cell) {
  if (!cell.land)
    return world.salinity >= 30
      ? "The bowl’s briny sea welcomes kelp and shell boats. Water dilutes the brine."
      : "A quiet sea patch. A little more sea salt can welcome kelp and shell boats.";

  if (cell.herbs <= 3)
    return "Bare ground needs a pinch of herbs before roots can grow.";

  if (cell.salt >= 65)
    return "Roots are wilting: local salt is at least 65%. Water rinses salt from this patch and its neighbours.";

  if (cell.moisture <= 25)
    return "Roots are thirsty: moisture is at most 25%. Water or kitchen rain helps them grow again.";

  if (cell.herbs > 35 && cell.sugar > 15)
    return "Moist, sweet herbs are growing flowers for glowbugs. Sugar slowly fades, so enjoy the lights.";

  return "Roots are growing: moisture is above 25% and local salt is below 65%. Sweet herbs can grow flowers.";
}
