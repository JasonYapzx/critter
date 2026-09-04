# critter — build plan

Standalone home for the crit-grab preview UI crit overlay
(spec: `~/Repos/my-second-brain/td/2026-09-02-preview-ui-crit.md`).
Target: any host app that can serve a static JS file.

## Decisions (from grilling, 2026-09-02)

1. **Distribution: prebuilt single-file bundle.** critter builds one
   self-contained `dist/crit.js` (IIFE). A host app copies that file into
   its public/static folder and adds a script tag. Nothing for the host
   bundler to resolve. This supersedes the spec's "commit the component
   source on the branch".
2. **Overlay tech: React 18, bundled into the IIFE.** Own React copy, own
   root div, fully isolated from the host app's React. Bundle size is
   irrelevant for a dev tool. Fiber walk reads `__reactFiber$*` DOM keys on
   the host app's nodes, so it works regardless.
3. **Repo shape: single Vite project.** Lib-mode build for the bundle plus
   a playground `index.html` for HMR development. No Next app here — the
   overlay is script-injected, so host-framework specifics don't matter.
4. **Gate: the script tag is the gate.** Bare `<script src="/crit.js">`,
   no env-var flag. The overlay only exists where a host chose to load
   the file. (Supersedes the spec's env-var gate.)

Everything else in the spec stands: state machine
(`idle → picking → pinned → drawing → copying`), `Alt+Shift+C` toggle,
`data-crit-ignore` self-exclusion, snapdom capture with
modern-screenshot/html2canvas as fallbacks, clipboard flavors
(`text/html` + `text/plain` on Copy; `image/png` on Copy image only),
and the v1 skip list (no multi-pin, no shapes/arrows, no color picker,
no mobile, no cropping).

## Repo layout

```
critter/
├── package.json          # pnpm, private
├── vite.config.ts        # lib mode → dist/crit.js (IIFE), NODE_ENV=production
├── index.html            # playground entry (dev only)
├── playground/
│   └── page.tsx          # fake host page: card grid, nested divs,
│                         #   Inter webfont — stresses hit-testing + snapdom
└── src/
    ├── main.tsx          # IIFE entry: append root div, mount <CritOverlay/>
    ├── CritOverlay.tsx   # state machine, highlight box, canvas, comment box, toast
    ├── fiber.ts          # DOM node → best-effort component name stack
    ├── capture.ts        # snapdom capture + annotation compositing + downscale
    └── clipboard.ts      # ClipboardItem flavors
```

Deps: `react`, `react-dom`, `@zumer/snapdom`, `vite`,
`@vitejs/plugin-react`, `typescript`. All bundled — `crit.js` has zero
runtime dependencies.

## Build order

0. **Scaffold.** `git init`, pnpm + Vite lib-mode setup, playground page.
   Exit test: `pnpm build` produces `dist/crit.js`; a plain
   `<script src>` of that file in a static page mounts the (empty) overlay.
1. **Overlay skeleton.** Toggle, hover highlight (`elementFromPoint`
   skipping `[data-crit-ignore]`), label chip, click-to-pin, `Esc`.
2. **Drawing canvas + comment box** over the pinned element. `Backspace`
   undoes last stroke; "include drawing" toggle; Copy / Copy image only /
   Cancel buttons (wired to stubs).
3. **Capture.** snapdom of `document.body` with crit chrome hidden,
   highlight kept, canvas composited on top; downscale past ~2 MB. Add a
   temporary "download PNG" path to eyeball fidelity. Hosts with
   Chakra/emotion and webfonts are a good fidelity check; fall back to
   modern-screenshot, then html2canvas if fidelity is bad.
4. **Clipboard.** Build the `text/html` + `text/plain` flavors; verify a
   single paste lands as image + text in Notion and as markdown in a
   plain editor. Wire the real Copy buttons.
5. **Fiber name stack.** Garnish, never blocks copying.
6. **Host drop-in.** After `pnpm build`, print console instructions for
   copying `dist/crit.js` and adding a script tag. Verify on
   `script-tag.html` and on at least one real host app.

Steps 1–5 are developed and verified in the playground; step 6 is
loading the IIFE in a host.

## Later / open

- `keep_fnames` terser tweak in a host's minifier (preview/dev only)
  to make the fiber stack real signal. After v1.
- Same two-line drop-in (file + script tag) in any other app.
