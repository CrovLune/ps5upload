import { isAndroid } from "./platform";

/**
 * Marks the page with the platform the app runs on (`<html data-platform="android">`),
 * so index.css can adjust the look where a platform needs it.
 *
 * Android: no frosted-glass blur. Android WebView mis-draws `backdrop-filter` (a copy of
 * what is behind a glass card shows up above it: the Connection title appeared twice on
 * the emulator, gone with the blur off), and the blur is the heaviest thing on screen for
 * a phone to repaint while scrolling.
 */
export function markPlatform(root: HTMLElement | null, android: boolean = isAndroid()): void {
  if (!root) return;
  if (android) root.dataset.platform = "android";
  else delete root.dataset.platform;
}

if (typeof document !== "undefined") markPlatform(document.documentElement);
