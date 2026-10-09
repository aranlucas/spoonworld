import { GUIDE, type World } from "../simulation.ts";
import { residentName, residentObservation } from "../naturalist.ts";
import { Icon } from "../Icon.tsx";
import { Dialog } from "./Dialog.tsx";

const CLUE_TITLES = [
  "A place to put down roots",
  "A well-seasoned sea",
  "Weather from the pantry",
  "A meadow with its own lights",
  "Something lighter than air",
];

interface GuideDialogProps {
  open: boolean;
  world: World;
  onClose: () => void;
  onVisitPatch: (cellId: number) => void;
}

export function GuideDialog(props: GuideDialogProps) {
  const { open, world, onClose, onVisitPatch } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      id="guide-dialog"
      titleId="guide-title"
      eyebrow="A NATURALIST’S KITCHEN NOTEBOOK"
      closeLabel="Close field guide"
      title="The unexpected field guide."
      subtitle="Follow a clue. Try a combination. Let the bowl surprise you."
    >
      <div id="guide-progress">
        <span>{world.discovered.length} of 5 wonders found</span>
        <span className="progress-dots">
          {GUIDE.map((g) => (
            <i key={g.id} className={world.discovered.includes(g.id) ? "found" : ""} />
          ))}
        </span>
      </div>
      <div id="guide-entries">
        {GUIDE.map((g, index) => {
          const found = world.discovered.includes(g.id);

          return (
            <article key={g.id} className={`guide-entry ${found ? "discovered" : ""}`}>
              <span className="field-art">
                <Icon name={g.glyph} />
              </span>
              <div>
                <span className="eyebrow">
                  FIELD NOTE {String(index + 1).padStart(2, "0")} ·{" "}
                  {found ? "DISCOVERED" : "A CLUE"}
                </span>
                <h3>{found ? g.title : CLUE_TITLES[index]}</h3>
                <p>{found ? g.text : g.hint}</p>
                {found && <span className="recipe">{g.recipe}</span>}
              </div>
              {found && <Icon name="check" className="entry-check" />}
            </article>
          );
        })}
      </div>
      <details className="neighbour-notes">
        <summary>Meet your twelve neighbours</summary>
        <p>
          Their notes follow the same local rules as the bowl. Visit a home patch to try something
          new.
        </p>
        <ol id="resident-entries">
          {world.residents.map((resident) => (
            <li key={resident.id}>
              <button className="resident-note" onClick={() => onVisitPatch(resident.cell)}>
                <span className="resident-mark" aria-hidden="true">
                  <Icon name="leaf" />
                </span>
                <span>
                  <strong>{residentName(resident)}</strong>
                  <span>{residentObservation(world, resident)}</span>
                  <small>
                    Visit home patch {resident.cell + 1} <span aria-hidden="true">↗</span>
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </details>
      <details className="how-to">
        <summary>A few gentle instructions</summary>
        <p>
          Choose an ingredient, then tap a patch in the bowl. Nearby patches get a lighter dose. The
          large button uses your last chosen patch. Worlds evolve once a second. Pause holds the
          ecology still while you experiment.
        </p>
        <p>
          On a keyboard: 1–7 select ingredients, Enter on the bowl sprinkles, arrow keys choose a
          patch, Space pauses, and Z undoes. Undo restores the full world before your last pinch,
          including its field notes. Reset starts this seed again; it can be undone. Change seeds to
          meet a different island.
        </p>
        <p>
          Everything stays on this device. Export a world to keep it or move it to another browser.
          After the offline-ready badge appears, the installed app or this URL works without a
          connection. This is a whimsical ecology, not cooking or science advice.
        </p>
      </details>
    </Dialog>
  );
}
