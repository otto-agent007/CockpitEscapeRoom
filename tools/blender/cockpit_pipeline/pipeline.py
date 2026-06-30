from __future__ import annotations

import sys
from pathlib import Path


def _ensure_repo_importable() -> None:
    if __package__:
        return
    repo_root = Path(__file__).resolve().parents[3]
    repo_root_text = str(repo_root)
    if repo_root_text not in sys.path:
        sys.path.insert(0, repo_root_text)


def main(argv: list[str] | None = None) -> int:
    _ensure_repo_importable()

    if argv is None:
        argv = sys.argv[1:]

    if argv and argv[0] == "preflight":
        from tools.blender.cockpit_pipeline.preflight import main as preflight_main

        return preflight_main(argv[1:])

    from tools.blender.cockpit_pipeline.pipeline_cli import main as pipeline_cli_main

    return pipeline_cli_main(argv)


if __name__ == "__main__":
    raise SystemExit(main())
