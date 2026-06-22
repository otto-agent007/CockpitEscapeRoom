from __future__ import annotations

from dataclasses import dataclass


REQUESTED = "requested"
SOURCING_COMPLETE = "sourcing_complete"
SOURCE_APPROVED = "source-approved"
ASSEMBLY_COMPLETE = "assembly_complete"
ASSEMBLY_APPROVED = "assembly-approved"
SHADING_APPROVED = "shading-approved"
REJECTED = "rejected"

STAGES = {REQUESTED, SOURCING_COMPLETE, SOURCE_APPROVED, ASSEMBLY_COMPLETE, ASSEMBLY_APPROVED, SHADING_APPROVED, REJECTED}

ALLOWED_TRANSITIONS = {
    REQUESTED: {SOURCING_COMPLETE, SOURCE_APPROVED, REJECTED},
    SOURCING_COMPLETE: {SOURCE_APPROVED, REJECTED},
    SOURCE_APPROVED: {ASSEMBLY_COMPLETE, ASSEMBLY_APPROVED, REJECTED},
    ASSEMBLY_COMPLETE: {ASSEMBLY_APPROVED, REJECTED},
    ASSEMBLY_APPROVED: {SHADING_APPROVED, REJECTED},
    SHADING_APPROVED: set(),
    REJECTED: set(),
}


@dataclass(frozen=True)
class Transition:
    from_stage: str
    to_stage: str


class StateTransitionError(ValueError):
    """Raised when a pipeline handoff tries to skip required approval."""


def validate_stage(stage: str) -> None:
    if stage not in STAGES:
        raise StateTransitionError(f"invalid stage {stage!r}; expected one of {sorted(STAGES)}")


def can_transition(from_stage: str, to_stage: str) -> bool:
    validate_stage(from_stage)
    validate_stage(to_stage)
    return to_stage in ALLOWED_TRANSITIONS[from_stage]


def require_transition(from_stage: str, to_stage: str) -> Transition:
    if not can_transition(from_stage, to_stage):
        raise StateTransitionError(
            f"cannot transition from {from_stage!r} to {to_stage!r}; "
            "source approval is required before assembly, and assembly approval is required before shading"
        )
    return Transition(from_stage=from_stage, to_stage=to_stage)
