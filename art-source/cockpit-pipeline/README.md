# Cockpit Pipeline Working Area

Ubuntu-owned working contracts and handoffs for the CockpitEscapeRoom staged Blender cockpit pipeline.

Generated downloads, extracted repositories, disposable GLBs, and temporary renders belong under the configured cache directory, not in Git.

Start every new batch with Agent 0 reference authority, then proceed through Agent 1 sourcing, Agent 2 assembly, Agent 3 materials and optimization, and a separate Windows/browser integration handoff when runtime code must consume the asset.

Structured gate examples live in `gates/examples/` and can be validated with `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate ...`. Run `npm run pipeline:evals` before publishing a pipeline PR to catch known agent workflow failure modes.
