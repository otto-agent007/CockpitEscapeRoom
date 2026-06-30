from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from reference_utils import REFERENCE_ROOT, load_manifest, repo_relative

OUTPUT = REFERENCE_ROOT / "dc9-51" / "notes" / "modeling-brief.md"


def generate_brief() -> Path:
    manifest = load_manifest()
    grouped: dict[str, list[tuple[str, dict]]] = defaultdict(list)
    for reference_id, entry in manifest.items():
        grouped[str(entry.get("classification", "unknown"))].append((reference_id, entry))

    lines = [
        "# DC-9-51 Modeling Brief",
        "",
        "Target: Northwest-style McDonnell Douglas DC-9-51 cockpit. Use this brief as reference triage, not as production approval.",
        "",
        "## Reference Hierarchy",
        "",
    ]

    for classification in ("primary", "secondary", "presentation", "mood", "rejected"):
        entries = grouped.get(classification, [])
        if not entries:
            continue
        lines.append(f"### {classification.title()}")
        lines.append("")
        for reference_id, entry in entries:
            aircraft = entry.get("aircraft", {})
            lines.extend(
                [
                    f"- `{reference_id}`: {entry.get('title')}",
                    f"  Variant/operator: {aircraft.get('variant')} / {aircraft.get('operator')}",
                    f"  Viewpoint: {entry.get('viewpoint')}",
                    f"  Intended uses: {', '.join(entry.get('intended_uses', []))}",
                    f"  Compatibility: {entry.get('target_compatibility')}",
                    f"  Limitations: {entry.get('limitations')}",
                    "",
                ]
            )

    lines.extend(
        [
            "## Missing Primary Views",
            "",
            "- DC-9-51 overhead panel close-up.",
            "- DC-9-51 pedestal and throttle quadrant close-up.",
            "- Captain sidewall and window mechanism.",
            "- First officer side view.",
            "- Label/placard close-ups with complete source records.",
            "",
            "## Production Modeling Guardrails",
            "",
            "- Do not start final cockpit geometry from the secondary or presentation rows.",
            "- Use secondary rows only when a shared component/material cue is explicitly relevant.",
            "- Keep all interactions fictional and non-operational.",
            "- Do not use reference photos as textures unless the source record supports that use.",
            "",
        ]
    )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {repo_relative(OUTPUT)}")
    return OUTPUT


if __name__ == "__main__":
    generate_brief()
