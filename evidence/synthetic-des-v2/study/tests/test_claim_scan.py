"""Claim-boundary unit tests."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from verify_package import scan_claims


class ClaimScanTests(unittest.TestCase):
    def test_rejects_positive_prohibited_claims(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            (base / "bad.md").write_text("This is a CHESSCON result and validated terminal outcome.\n", encoding="utf-8")
            violations = scan_claims(base)
            self.assertEqual(len(violations), 2)

    def test_allows_required_negative_boundary(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            (base / "good.md").write_text("This is not a CHESSCON result; it is synthetic offline development evidence.\n", encoding="utf-8")
            self.assertEqual(scan_claims(base), [])


if __name__ == "__main__":
    unittest.main()
