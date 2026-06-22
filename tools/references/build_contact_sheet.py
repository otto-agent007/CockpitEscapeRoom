from __future__ import annotations

import html
from pathlib import Path

from reference_utils import IMAGE_SUFFIXES, REFERENCE_ROOT, load_manifest, local_path, repo_relative

OUTPUT = REFERENCE_ROOT / "dc9-51" / "contact-sheets" / "dc9-51-contact-sheet.svg"


def _text(value: object) -> str:
    return html.escape(str(value))


def build_contact_sheet() -> Path:
    manifest = load_manifest()
    image_entries = [
        (reference_id, entry)
        for reference_id, entry in manifest.items()
        if local_path(entry).exists() and local_path(entry).suffix.lower() in IMAGE_SUFFIXES
    ]
    card_w = 420
    card_h = 360
    gap = 24
    cols = 2
    rows = max(1, (len(image_entries) + cols - 1) // cols)
    width = cols * card_w + (cols + 1) * gap
    height = rows * card_h + (rows + 1) * gap + 70

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="#f6f4ef"/>',
        '<text x="24" y="38" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#20242a">DC-9-51 Reference Contact Sheet</text>',
        '<text x="24" y="62" font-family="Arial, sans-serif" font-size="13" fill="#545b64">Generated from reference-manifest.yaml. Variant mismatches are intentionally labeled.</text>',
    ]

    for index, (reference_id, entry) in enumerate(image_entries):
        col = index % cols
        row = index // cols
        x = gap + col * (card_w + gap)
        y = 90 + row * (card_h + gap)
        path = local_path(entry)
        rel_href = html.escape(Path("..", entry["local_file"].split("/", 1)[1]).as_posix())
        aircraft = entry.get("aircraft", {})
        role = "; ".join(entry.get("intended_uses", [])[:2])
        label_lines = [
            reference_id,
            f"{aircraft.get('variant', 'unknown')} | {aircraft.get('operator', 'unknown')} | {entry.get('viewpoint', 'unknown')}",
            f"{entry.get('classification', 'unknown')} | confidence {entry.get('confidence', 'unknown')}",
            role,
        ]
        parts.extend(
            [
                f'<rect x="{x}" y="{y}" width="{card_w}" height="{card_h}" rx="6" fill="#ffffff" stroke="#c8ccd2"/>',
                f'<image href="{rel_href}" x="{x + 16}" y="{y + 16}" width="{card_w - 32}" height="220" preserveAspectRatio="xMidYMid meet"/>',
            ]
        )
        text_y = y + 260
        for line_index, line in enumerate(label_lines):
            size = 13 if line_index else 14
            weight = "700" if line_index == 0 else "400"
            parts.append(
                f'<text x="{x + 16}" y="{text_y + line_index * 22}" font-family="Arial, sans-serif" '
                f'font-size="{size}" font-weight="{weight}" fill="#20242a">{_text(line[:96])}</text>'
            )
        if not path.exists():
            parts.append(f'<text x="{x + 16}" y="{y + 130}" fill="#a33">Missing local image</text>')

    parts.append("</svg>")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("\n".join(parts) + "\n", encoding="utf-8")
    print(f"Wrote {repo_relative(OUTPUT)}")
    return OUTPUT


if __name__ == "__main__":
    build_contact_sheet()
