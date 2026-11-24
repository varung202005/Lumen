import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from diagnostics import diagnose_run
from profiling import profile_csv


def test_low_f1_and_metric_gap_create_findings():
    findings = diagnose_run("run-1", "exp-1", "ds-1", "completed", {"accuracy": 0.82, "f1": 0.61}, None, [])
    titles = {finding["title"] for finding in findings}
    assert "Accuracy and F1 disagree" in titles


def test_profile_detects_pii_outliers_and_leakage(tmp_path):
    csv = tmp_path / "data.csv"
    csv.write_text("""email,value,target,copy_target
a@demo.com,1,no,no
b@demo.com,2,no,no
c@demo.com,3,yes,yes
d@demo.com,1000,yes,yes
""")
    profile = profile_csv(str(csv), "target")
    assert "email" in profile["piiColumns"]
    assert profile["outliers"]
    assert profile["potentialLeakage"][0]["column"] == "copy_target"
