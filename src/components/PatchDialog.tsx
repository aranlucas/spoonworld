import { INGREDIENTS, type Ingredient, type IngredientId, type World } from "../simulation.ts";
import { patchName, patchObservation, residentName } from "../naturalist.ts";
import { Icon } from "../Icon.tsx";
import { Dialog } from "./Dialog.tsx";
import { pinchLabel } from "./Pantry.tsx";

const METERS = [
  ["Herbs", "herbs"],
  ["Moisture", "moisture"],
  ["Local salt", "salt"],
  ["Sweetness", "sugar"],
  ["Acidity", "acid"],
  ["Soda", "soda"],
  ["Flowers", "flowers"],
] as const;

interface PatchDialogProps {
  open: boolean;
  world: World;
  target: number;
  ingredient: Ingredient;
  canUndo: boolean;
  onClose: () => void;
  onTarget: (cellId: number) => void;
  onIngredient: (id: IngredientId) => void;
  onSprinkle: () => void;
  onUndo: () => void;
}

function chemistryNote(world: World, target: number): string {
  const cell = world.cells[target];

  if (cell.acid >= 4)
    return "A little acidity is waiting here. Try baking soda on this same patch.";

  if (cell.soda >= 4) return "Baking soda is waiting here. Try lemon on this same patch.";

  if (world.fizz > 10)
    return "The bowl is fizzing. Sproutlings can ride the bubbles until the fizz fades.";

  return "Lemon and baking soda react when they meet on a patch or its neighbours.";
}

export function PatchDialog(props: PatchDialogProps) {
  const { open, world, target, ingredient, canUndo } = props;
  const cell = world.cells[target];
  const names = world.residents.filter((r) => r.cell === target).map(residentName);

  return (
    <Dialog
      open={open}
      onClose={props.onClose}
      id="patch-dialog"
      titleId="patch-title"
      eyebrow="LOOK A LITTLE CLOSER"
      closeLabel="Close patch notebook"
      title="The patch notebook."
      subtitle="Observe a cause. Try a pinch. Compare. Ecology rests while this notebook is open."
    >
      <label className="notebook-label" htmlFor="patch-select">
        Choose a patch
      </label>
      <select
        id="patch-select"
        value={target}
        onChange={(event) => props.onTarget(Number(event.target.value))}
      >
        {world.cells.map((c) => (
          <option key={c.id} value={c.id}>
            {patchName(c)}
          </option>
        ))}
      </select>
      <p id="patch-observation" className="patch-observation" role="status">
        {patchObservation(world, cell)}
      </p>
      <dl id="patch-meters" className="patch-meters">
        {METERS.map(([label, key]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{Math.round(cell[key])}%</dd>
          </div>
        ))}
      </dl>
      <p id="patch-chemistry" className="patch-chemistry">
        {chemistryNote(world, target)}
      </p>
      <p id="patch-residents" className="patch-residents">
        {names.length
          ? `Home patch for ${names.join(", ")}. Sailors and ferry riders can be away exploring.`
          : "No sproutlings call this patch home just now. They look for kind meadows."}
      </p>
      <label className="notebook-label" htmlFor="patch-ingredient">
        Try an ingredient here
      </label>
      <select
        id="patch-ingredient"
        value={ingredient.id}
        onChange={(event) => {
          const item = INGREDIENTS.find((i) => i.id === event.target.value);

          if (item) props.onIngredient(item.id);
        }}
      >
        {INGREDIENTS.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>
      <div className="patch-actions">
        <button id="patch-sprinkle" className="sprinkle-button" onClick={props.onSprinkle}>
          {pinchLabel(ingredient)}
        </button>
        <button id="patch-undo" className="tool-button" disabled={!canUndo} onClick={props.onUndo}>
          <Icon name="undo" /> Undo
        </button>
      </div>
    </Dialog>
  );
}
