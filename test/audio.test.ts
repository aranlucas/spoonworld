import { afterEach, expect, test, vi } from "vitest";
import { createSound } from "@/audio.ts";

afterEach(() => vi.unstubAllGlobals());

test("failed activation stays silent and the next toggle retries resume", async () => {
  const resume = vi
    .fn()
    .mockRejectedValueOnce(new Error("Device unavailable"))
    .mockResolvedValue(null);

  const createOscillator = vi.fn();
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal(
    "AudioContext",
    class {
      resume = resume;
      createOscillator = createOscillator;
    },
  );
  const sound = createSound();

  await expect(sound.toggle()).rejects.toThrow("Device unavailable");
  sound.play();
  expect(createOscillator).not.toHaveBeenCalled();
  await expect(sound.toggle()).resolves.toBe(true);
  expect(resume).toHaveBeenCalledTimes(2);
  await expect(sound.toggle()).resolves.toBe(false);
});

test("construction failure can be retried with one toggle", async () => {
  const resume = vi.fn().mockResolvedValue(null);

  const constructor = vi
    .fn(function () {
      return { resume };
    })
    .mockImplementationOnce(function () {
      throw new Error("Audio unavailable");
    });

  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("AudioContext", constructor);
  const sound = createSound();

  await expect(sound.toggle()).rejects.toThrow("Audio unavailable");
  await expect(sound.toggle()).resolves.toBe(true);
  expect(resume).toHaveBeenCalledTimes(1);
});
