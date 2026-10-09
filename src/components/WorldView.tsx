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
    if (!parent.current) return;
    const renderer = mountWorld(parent.current, callbacks);

    onReady(renderer);

    return () => {
      onReady(null);
      renderer.destroy();
    };
  }, [callbacks, onReady]);

  return (
    <div
      ref={parent}
      id="world-view"
      tabIndex={0}
      role="group"
      aria-label="Ingredient bowl. Use arrow keys to choose a patch, then Enter to add the selected ingredient."
    />
  );
}
