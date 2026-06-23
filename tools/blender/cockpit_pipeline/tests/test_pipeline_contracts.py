from __future__ import annotations

import copy
import tempfile
import unittest
from pathlib import Path

from tools.blender.cockpit_pipeline.hashing import file_record, verify_file_record
from tools.blender.cockpit_pipeline.schema_validation import SchemaError, load_schema, validate_json_file, validate
from tools.blender.cockpit_pipeline.state_machine import StateTransitionError, require_transition


ROOT = Path(__file__).resolve().parents[4]
JOB = ROOT / "art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/job.json"
MANIFEST = ROOT / "art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/manifests/source-approved.json"


class PipelineContractTests(unittest.TestCase):
    def test_sample_job_validates(self) -> None:
        data = validate_json_file(JOB, "job_request.schema.json")
        self.assertEqual(data["variantScope"], "unresolved")
        self.assertEqual([item["label"] for item in data["requestedComponents"]], [
            "one yoke assembly",
            "one throttle assembly",
            "one large gauge",
            "one switch cluster",
        ])

    def test_invalid_job_stage_is_rejected(self) -> None:
        data = validate_json_file(JOB, "job_request.schema.json")
        bad = copy.deepcopy(data)
        bad["stage"] = "assembly"
        schema = load_schema("job_request.schema.json")
        with self.assertRaises(SchemaError):
            validate(bad, schema)

    def test_missing_manifest_required_field_is_rejected(self) -> None:
        data = validate_json_file(MANIFEST, "stage_manifest.schema.json")
        bad = copy.deepcopy(data)
        del bad["sourceVariant"]
        schema = load_schema("stage_manifest.schema.json")
        with self.assertRaises(SchemaError):
            validate(bad, schema)

    def test_state_machine_blocks_skipped_approvals(self) -> None:
        require_transition("requested", "source-approved")
        require_transition("requested", "sourcing_complete")
        require_transition("sourcing_complete", "source-approved")
        require_transition("source-approved", "assembly_complete")
        require_transition("assembly_complete", "assembly-approved")
        require_transition("source-approved", "assembly-approved")
        require_transition("assembly-approved", "shading_complete")
        require_transition("shading_complete", "shading-approved")
        require_transition("assembly-approved", "shading-approved")
        with self.assertRaises(StateTransitionError):
            require_transition("requested", "assembly-approved")
        with self.assertRaises(StateTransitionError):
            require_transition("sourcing_complete", "assembly-approved")
        with self.assertRaises(StateTransitionError):
            require_transition("assembly_complete", "shading-approved")
        with self.assertRaises(StateTransitionError):
            require_transition("shading_complete", "assembly-approved")
        with self.assertRaises(StateTransitionError):
            require_transition("source-approved", "shading-approved")

    def test_hash_record_verification(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            sample = base / "handoff.txt"
            sample.write_text("approved handoff\n", encoding="utf-8")
            record = file_record(sample, base)
            verify_file_record(record, base)
            tampered = dict(record)
            tampered["sha256"] = "f" * 64
            with self.assertRaises(ValueError):
                verify_file_record(tampered, base)


if __name__ == "__main__":
    unittest.main()
