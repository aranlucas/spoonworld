import { useEffect, useRef } from "react";
import { mountWorld, type WorldCallbacks, type WorldRenderer } from "../renderer.ts";

interface WorldViewProps {
  callbacks: WorldCallbacks;
  onReady: (renderer: WorldRenderer | null) => void;
}

// Phaser owns this element's children; React only provides the mount point.
export function WorldView(props: WorldViewProps) {
  const { callbacks, onReady } = props;
  const parent = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderer = parent.current ? mountWorld(parent.current, callbacks) : null;

    onReady(renderer);

    return () => {
      onReady(null);
      renderer?.destroy();
    };
  }, [callbacks, onReady]);

  return (
    <div
      ref={parent}
      id="world-view"
      // Keyboard focus is required for arrow-key patch selection and Enter to sprinkle.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="group"
      aria-label="Ingredient bowl. Use arrow keys to choose a patch, then Enter to add the selected ingredient."
    />
  );
}
