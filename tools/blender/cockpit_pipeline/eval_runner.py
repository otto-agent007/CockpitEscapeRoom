from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DEFAULT_FIXTURES = Path(__file__).with_name("evals").joinpath("fixtures")


def run_evals(fixtures_dir: Path | None = None) -> dict[str, int]:
    base = fixtures_dir or DEFAULT_FIXTURES
    if not base.is_dir():
        raise FileNotFoundError(f"Eval fixture directory not found: {base}")

    total = 0
    passed = 0
    for path in sorted(base.glob("*.json")):
        total += 1
        fixture = _load_json(path)
        expected = sorted(fixture.get("expectedViolations", []))
        observed = sorted(_evaluate_fixture(fixture))
        if observed != expected:
            raise ValueError(
                f"{path}: expected violations {expected}, observed {observed}"
            )
        passed += 1

    if total == 0:
        raise ValueError(f"No eval fixtures found in {base}")
    return {"total": total, "passed": passed}


def _load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"{path}: fixture must be a JSON object")
    return data


def _evaluate_fixture(fixture: dict[str, Any]) -> list[str]:
    case = fixture.get("case")
    if case == "agent1-tripo-authority":
        return _eval_agent1_tripo_authority(fixture)
    if case == "agent2-reference-authority-required":
        return _eval_agent2_reference_authority_required(fixture)
    if case == "agent3-runtime-contract-preservation":
        return _eval_agent3_runtime_contract_preservation(fixture)
    if case == "aircraft-detail-separation":
        return _eval_aircraft_detail_separation(fixture)
    if case == "model-y-spoiler-protection":
        return _eval_model_y_spoiler_protection(fixture)
    raise ValueError(f"Unknown eval case: {case!r}")


def _eval_agent1_tripo_authority(fixture: dict[str, Any]) -> list[str]:
    candidate = fixture["candidate"]
    outcome = fixture["observedOutcome"]
    violations: list[str] = []
    if candidate.get("sourceType") == "tripo-candidate":
        if outcome.get("authority") != "proxy-only":
            violations.append("tripo-candidate-promoted-beyond-proxy")
        if outcome.get("mayProceedToProduction") is not False:
            violations.append("tripo-candidate-production-enabled")
        warnings = set(outcome.get("warnings", []))
        required = {
            "not-aircraft-specific-production-authority",
            "must-import-into-blender-before-runtime-use",
        }
        if not required.issubset(warnings):
            violations.append("tripo-candidate-missing-required-warnings")
    return violations


def _eval_agent2_reference_authority_required(fixture: dict[str, Any]) -> list[str]:
    violations: list[str] = []
    if fixture.get("referenceAuthorityNote") is None:
        outcome = fixture["observedOutcome"]
        if outcome.get("status") != "blocked":
            violations.append("agent2-started-without-reference-authority")
        if outcome.get("reason") != "missing-reference-authority":
            violations.append("agent2-missing-authority-reason-not-recorded")
    return violations


def _eval_agent3_runtime_contract_preservation(fixture: dict[str, Any]) -> list[str]:
    before = fixture["beforeOptimization"]
    after = fixture["afterOptimization"]
    violations: list[str] = []
    if before.get("runtimeNodes") != after.get("runtimeNodes"):
        violations.append("runtime-node-names-changed")
    if before.get("gameIds") != after.get("gameIds"):
        violations.append("game-ids-changed")
    if before.get("pivotReport") != after.get("pivotReport"):
        violations.append("pivot-report-changed")
    return violations


def _eval_aircraft_detail_separation(fixture: dict[str, Any]) -> list[str]:
    violations: list[str] = []
    target = fixture.get("targetSceneGroup")
    imported = set(fixture.get("importedDetailFamilies", []))
    if target == "DC-9 Pop T Captain cockpit" and "airbus" in imported:
        violations.append("airbus-detail-imported-into-dc9")
    if target == "Airbus A320 First-Officer cockpit" and "dc9" in imported:
        violations.append("dc9-detail-imported-into-airbus")
    return violations


def _eval_model_y_spoiler_protection(fixture: dict[str, Any]) -> list[str]:
    violations: list[str] = []
    if fixture.get("captainModeComplete") is True:
        return violations
    for surface in fixture.get("publicSurfaces", []):
        text = " ".join(str(surface.get(key, "")) for key in ("label", "copy", "assetPath")).lower()
        if "model y" in text or "tesla" in text:
            violations.append("model-y-spoiler-before-captain-complete")
            break
    return violations
