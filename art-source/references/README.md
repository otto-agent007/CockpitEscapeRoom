# Aircraft Reference Library

This folder stores source records and locally cached references for CockpitEscapeRoom visual work. It is an art-direction library, not a production texture library.

## Policy

- The target for this pack is Northwest-style McDonnell Douglas DC-9-51.
- Use `reference-manifest.yaml` as the source of truth for rights, variant, confidence, and intended use.
- Do not copy photos from sources unless the manifest records a direct download URL and license-compatible source.
- Do not use simulator screenshots as geometry authority. They can inform presentation benchmarks only.
- Do not mix DC-9 variants without labeling the source variant and recording compatibility limits.
- Keep private owner-supplied or personally licensed files under `local-private/`; that directory is intentionally not part of automated public download flow.

## Commands

```bash
npm run references:validate
npm run references:download
npm run references:contact-sheet
npm run references:brief
npm run references:check
```

`references:check` is offline by design. It validates existing artifacts and the Blender reference scene but does not download anything.

## Layout

```text
art-source/references/
├── reference-manifest.yaml
├── REFERENCE_REPORT.md
├── dc9-51/
│   ├── primary/
│   ├── secondary/
│   ├── presentation/
│   ├── annotations/
│   ├── notes/
│   └── contact-sheets/
└── local-private/
```

Original downloaded images remain unmodified. Derived callouts or markups belong under `dc9-51/annotations/`.
