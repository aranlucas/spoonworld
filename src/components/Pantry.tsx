import { INGREDIENTS, type Ingredient, type IngredientId } from "../simulation.ts";
import { Icon } from "../Icon.tsx";

export const pinchLabel = (item: Ingredient): string =>
  `Add ${item.id === "water" ? "a splash" : "a pinch"} of ${item.name.toLowerCase()}`;

interface PantryProps {
  selected: Ingredient;
  targetDescription: string;
  onSelect: (id: IngredientId) => void;
  onSprinkle: () => void;
}

export function Pantry(props: PantryProps) {
  const { selected, targetDescription, onSelect, onSprinkle } = props;

  return (
    <aside className="pantry" aria-label="Ingredient pantry">
      <div className="pantry-head">
        <span className="eyebrow">THE PANTRY</span>
        <span className="pantry-number">01—07</span>
      </div>
      <h2>
        Little things.
        <br /> Lovely consequences.
      </h2>
      <p className="pantry-instruction">Select something to sprinkle.</p>
      <div className="ingredients">
        {INGREDIENTS.map((item, index) => (
          <button
            key={item.id}
            className="ingredient"
            data-ingredient={item.id}
            aria-pressed={item.id === selected.id}
            style={{ "--ingredient": item.color }}
            onClick={() => onSelect(item.id)}
          >
            <span className="ingredient-art">
              <Icon name={item.glyph} />
            </span>
            <span>
              <strong>{item.name}</strong>
              <small>{item.note}</small>
            </span>
            <span className="ingredient-key">{index + 1}</span>
            <span className="selected-check">
              <Icon name="check" />
            </span>
          </button>
        ))}
      </div>
      <div className="ingredient-detail">
        <p id="ingredient-effect">{selected.effect}</p>
        <button id="sprinkle" className="sprinkle-button" onClick={onSprinkle}>
          <Icon name="spoon" />
          <span>{pinchLabel(selected)}</span>
          <span className="button-arrow">↗</span>
        </button>
        <span id="target-description">{targetDescription}</span>
      </div>
    </aside>
  );
}
