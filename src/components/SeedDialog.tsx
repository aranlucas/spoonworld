import { useState, type FormEvent } from "react";
import { Dialog } from "./Dialog.tsx";

const PRESETS = ["lemon-garden", "sunday-soup", "wild-thyme"];

interface SeedDialogProps {
  open: boolean;
  seed: string;
  onClose: () => void;
  onSubmit: (seed: string) => void;
}

export function SeedDialog(props: SeedDialogProps) {
  const { open, seed, onClose, onSubmit } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      id="seed-dialog"
      titleId="seed-title"
      eyebrow="ONE BOWL, MANY WORLDS"
      closeLabel="Close seed settings"
      title="A fresh little beginning."
      subtitle="The same seed grows the same island. Your current world can be restored with Undo."
    >
      {/* Remount on open so the field starts from the current seed. */}
      <SeedForm key={String(open)} seed={seed} onSubmit={onSubmit} />
    </Dialog>
  );
}

function SeedForm(props: Pick<SeedDialogProps, "seed" | "onSubmit">) {
  const [value, setValue] = useState(props.seed);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    props.onSubmit(value);
  };

  return (
    <form id="seed-form" onSubmit={submit}>
      <label htmlFor="seed-input">Name your world seed</label>
      <input
        id="seed-input"
        maxLength={40}
        required
        autoComplete="off"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="seed-presets">
        {PRESETS.map((preset) => (
          <button key={preset} type="button" data-seed={preset} onClick={() => setValue(preset)}>
            {preset}
          </button>
        ))}
      </div>
      <button className="sprinkle-button" type="submit">
        Grow this world <span>↗</span>
      </button>
    </form>
  );
}
