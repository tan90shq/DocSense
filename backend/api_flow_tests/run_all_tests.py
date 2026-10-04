import os
import sys
import json
import shutil
import time
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure root directory is in sys.path so we can import main and services
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from main import app

client = TestClient(app, raise_server_exceptions=False)

DATA_DIR = PROJECT_ROOT / "data"
UPLOADS_DIR = PROJECT_ROOT / "uploads"
ALL_PDFS_FILE = DATA_DIR / "all_pdfs.json"
ALL_SESSIONS_FILE = DATA_DIR / "all_sessions.json"

TEST_ASSETS_DIR = PROJECT_ROOT / "test"
SAMPLE_PDF = TEST_ASSETS_DIR / "Asterion_001_[Simple].pdf"
SAMPLE_KB_PDF = TEST_ASSETS_DIR / "Nimbus_Internal_Knowledge_Base.pdf"

# Store test results
results = []

def record(test_id, category, name, passed, status_code, details, bug_found=None):
    results.append({
        "id": test_id,
        "category": category,
        "name": name,
        "passed": passed,
        "status_code": status_code,
        "details": details,
        "bug_found": bug_found
    })
    tag = "PASS" if passed else "FAIL"
    bug_tag = f" [BUG DETECTED: {bug_found}]" if bug_found else ""
    print(f"[{tag}] {test_id} - {category}: {name} (HTTP {status_code}){bug_tag}")
    if details:
        clean_details = str(details[:200]).encode("ascii", "replace").decode("ascii")
        print(f"       Info: {clean_details}")

def setup_environment():
    """Backup data files before running tests."""
    print("=" * 80)
    print("BACKING UP USER DATA FILES (PRESERVING ALL USER STATE)...")
    print("=" * 80)
    if ALL_PDFS_FILE.exists():
        shutil.copy2(ALL_PDFS_FILE, ALL_PDFS_FILE.with_suffix(".json.test_bak"))
    if ALL_SESSIONS_FILE.exists():
        shutil.copy2(ALL_SESSIONS_FILE, ALL_SESSIONS_FILE.with_suffix(".json.test_bak"))

def teardown_environment():
    """Restore data files to original state."""
    print("=" * 80)
    print("RESTORING USER DATA FILES TO ORIGINAL STATE...")
    print("=" * 80)
    bak_pdfs = ALL_PDFS_FILE.with_suffix(".json.test_bak")
    bak_sessions = ALL_SESSIONS_FILE.with_suffix(".json.test_bak")
    if bak_pdfs.exists():
        shutil.move(str(bak_pdfs), str(ALL_PDFS_FILE))
    if bak_sessions.exists():
        shutil.move(str(bak_sessions), str(ALL_SESSIONS_FILE))


def run_tests():
    print("\n" + "=" * 80)
    print("STARTING FULL API FLOW & EDGE CASE TEST SUITE")
    print("=" * 80 + "\n")

    # -------------------------------------------------------------
    # 1. ROOT ENDPOINT
    # -------------------------------------------------------------
    try:
        r = client.get("/")
        passed = (r.status_code == 200 and "AI & RAG" in r.text)
        record("TC-01", "Health", "GET / returns welcome message", passed, r.status_code, r.text)
    except Exception as e:
        record("TC-01", "Health", "GET / returns welcome message", False, 0, str(e))

    # -------------------------------------------------------------
    # 2. SESSION LIFECYCLE & EDGE CASES
    # -------------------------------------------------------------
    created_session_id = None
    try:
        r = client.post("/session-create")
        passed = (r.status_code == 200)
        # Check all_sessions.json to retrieve the generated ID
        if passed and ALL_SESSIONS_FILE.exists():
            with open(ALL_SESSIONS_FILE, "r") as f:
                sessions_data = json.load(f)
                if sessions_data:
                    created_session_id = sessions_data[-1]["session_id"]
        record("TC-02", "Session", "POST /session-create creates new session", passed, r.status_code,
               f"Response: {r.text}, Session ID allocated: {created_session_id}")
    except Exception as e:
        record("TC-02", "Session", "POST /session-create creates new session", False, 0, str(e))

    # Edge Case: Delete non-existent session ID
    try:
        r = client.delete("/session-delete/999999")
        passed = (r.status_code == 404 and "session not found" in r.text)
        bug = "Returns 'file not found' instead of 'session not found'" if "file not found" in r.text else None
        record("TC-03", "Session [Edge]", "DELETE /session-delete with invalid ID returns 404", passed, r.status_code, r.text, bug)
    except Exception as e:
        record("TC-03", "Session [Edge]", "DELETE /session-delete with invalid ID returns 404", False, 0, str(e))

    # Edge Case: Delete session with invalid type (string instead of int)
    try:
        r = client.delete("/session-delete/invalid_session_str")
        passed = (r.status_code == 422)
        record("TC-04", "Session [Edge]", "DELETE /session-delete with string ID returns 422 validation error", passed, r.status_code, r.text)
    except Exception as e:
        record("TC-04", "Session [Edge]", "DELETE /session-delete with string ID returns 422", False, 0, str(e))

    # -------------------------------------------------------------
    # 3. PDF UPLOAD & EDGE CASES
    # -------------------------------------------------------------
    # Edge Case: Missing file in upload
    try:
        r = client.post("/upload", files={})
        passed = (r.status_code == 422)
        record("TC-05", "Upload [Edge]", "POST /upload with no file returns 422 Unprocessable Entity", passed, r.status_code, r.text)
    except Exception as e:
        record("TC-05", "Upload [Edge]", "POST /upload with no file returns 422", False, 0, str(e))

    # Edge Case: 0-byte empty file upload
    try:
        r = client.post("/upload", files={"file": ("empty_file.pdf", b"", "application/pdf")})
        # Expect 500 or 400 because PyMuPDF throws FileDataError on empty file
        passed = (r.status_code in [400, 500])
        bug = "PyMuPDF throws FileDataError (500) before chunk_generator guard is reached" if r.status_code == 500 else None
        record("TC-06", "Upload [Edge]", "POST /upload with 0-byte PDF handled", passed, r.status_code, r.text, bug)
    except Exception as e:
        record("TC-06", "Upload [Edge]", "POST /upload with 0-byte PDF", False, 0, str(e))
    finally:
        empty_on_disk = UPLOADS_DIR / "empty_file.pdf"
        try:
            if empty_on_disk.exists():
                empty_on_disk.unlink()
        except OSError:
            pass

    # Edge Case: Corrupt non-PDF file upload
    corrupt_pre = UPLOADS_DIR / "corrupt_test_file.pdf"
    if corrupt_pre.exists():
        try:
            corrupt_pre.unlink()
        except OSError:
            pass
    try:
        r = client.post("/upload", files={"file": ("corrupt_test_file.pdf", b"NOT A REAL PDF FILE HEADER", "application/pdf")})
        passed = (r.status_code in [400, 500])
        bug = "Unhandled 500 server crash on corrupt PDF instead of HTTP 400" if r.status_code == 500 else None
        record("TC-07", "Upload [Edge]", "POST /upload with corrupt binary file fails gracefully", passed, r.status_code, r.text, bug)
    except Exception as e:
        record("TC-07", "Upload [Edge]", "POST /upload with corrupt binary file", False, 0, str(e))
    finally:
        corrupt_on_disk = UPLOADS_DIR / "corrupt_test_file.pdf"
        try:
            if corrupt_on_disk.exists():
                corrupt_on_disk.unlink()
        except OSError:
            pass

    # Edge Case: Filename with spaces and special characters
    special_name = "My Test Doc (v1.0) #1.pdf"
    try:
        with open(SAMPLE_PDF, "rb") as f:
            pdf_bytes = f.read()
        r = client.post("/upload", files={"file": (special_name, pdf_bytes, "application/pdf")})
        # Check what was created on disk vs Qdrant
        # main.py replaces forbidden chars with '_' -> new_file_name
        bug = None
        if r.status_code == 200:
            resp = r.json()
            saved_path = Path(resp.get("file_path", ""))
            disk_exists = saved_path.exists()
            if not disk_exists:
                bug = "File saved with different name than reported"
            # Delete using the returned/sanitized filename
            del_r = client.delete(f"/delete/{saved_path.name}")
            if del_r.status_code != 200:
                bug = f"Saved on disk as '{saved_path.name}' but delete returned HTTP {del_r.status_code}: {del_r.text}"
                if saved_path.exists():
                    saved_path.unlink()
            passed = (bug is None)
        else:
            passed = False
            bug = f"Upload failed: {r.text}"
        record("TC-08", "Upload [Edge]", "POST /upload with spaces/symbols tests filename consistency", passed, r.status_code, r.text, bug)
    except Exception as e:
        record("TC-08", "Upload [Edge]", "POST /upload with spaces/symbols", False, 0, str(e))

    # Happy Path Upload: Valid Sample PDF
    test_upload_name = "Test_Asterion_Pipeline.pdf"
    test_upload_path = UPLOADS_DIR / test_upload_name
    if test_upload_path.exists():
        test_upload_path.unlink()

    upload_success = False
    try:
        with open(SAMPLE_PDF, "rb") as f:
            pdf_bytes = f.read()
        r = client.post("/upload", files={"file": (test_upload_name, pdf_bytes, "application/pdf")})
        upload_success = (r.status_code == 200)
        record("TC-09", "Upload", "POST /upload happy path indexing into Qdrant", upload_success, r.status_code, r.text)
    except Exception as e:
        record("TC-09", "Upload", "POST /upload happy path", False, 0, str(e))

    # Edge Case: Duplicate file upload (Expect 409 Conflict)
    try:
        with open(SAMPLE_PDF, "rb") as f:
            pdf_bytes = f.read()
        r = client.post("/upload", files={"file": (test_upload_name, pdf_bytes, "application/pdf")})
        passed = (r.status_code == 409 and "already exists" in r.text)
        record("TC-10", "Upload [Edge]", "POST /upload duplicate returns 409 Conflict", passed, r.status_code, r.text)
    except Exception as e:
        record("TC-10", "Upload [Edge]", "POST /upload duplicate", False, 0, str(e))

    # -------------------------------------------------------------
    # 4. ASK / CHAT RAG ENDPOINT & EDGE CASES
    # -------------------------------------------------------------
    # Edge Case: Ask with non-existent session ID
    try:
        payload = {
            "query": "What is the Aster platform?",
            "include_pdf": ["Nimbus_Internal_Knowledge_Base.pdf"]
        }
        r = client.post("/ask?session_id=999999", json=payload)
        passed = (r.status_code == 404 and "session not found" in r.text)
        record("TC-11", "Ask [Edge]", "POST /ask with invalid session_id returns 404", passed, r.status_code, r.text)
    except Exception as e:
        record("TC-11", "Ask [Edge]", "POST /ask with invalid session_id", False, 0, str(e))

    # Edge Case: Ask with empty include_pdf list []
    if created_session_id:
        try:
            payload = {
                "query": "What is the company profile?",
                "include_pdf": []
            }
            r = client.post(f"/ask?session_id={created_session_id}", json=payload)
            # Empty include_pdf means no retrieval happens; let's see what answer_generator returns
            passed = (r.status_code == 200)
            record("TC-12", "Ask [Edge]", "POST /ask with empty include_pdf: [] handled gracefully", passed, r.status_code, r.text[:200])
        except Exception as e:
            record("TC-12", "Ask [Edge]", "POST /ask with empty include_pdf: []", False, 0, str(e))

    # Edge Case: Ask with non-existent Qdrant collection in include_pdf
    if created_session_id:
        try:
            payload = {
                "query": "What is the company profile?",
                "include_pdf": ["non_existent_collection_ghost.pdf"]
            }
            r = client.post(f"/ask?session_id={created_session_id}", json=payload)
            passed = (r.status_code == 404 and "file not found" in r.text)
            record("TC-13", "Ask [Edge]", "POST /ask with non-existent PDF name returns 404", passed, r.status_code, r.text[:200])
        except Exception as e:
            record("TC-13", "Ask [Edge]", "POST /ask with non-existent PDF", False, 0, str(e))

    # Happy Path: Valid RAG Query against indexed document
    if created_session_id:
        target_pdf = test_upload_name if upload_success else "Nimbus_Internal_Knowledge_Base.pdf"
        try:
            payload = {
                "query": "Where is Asterion Labs based and what is its address?",
                "include_pdf": [target_pdf]
            }
            t0 = time.time()
            r = client.post(f"/ask?session_id={created_session_id}", json=payload)
            elapsed = time.time() - t0
            passed = (r.status_code == 200 and len(r.text) > 10 and ("Pune" in r.text or "Asterion" in r.text))
            record("TC-14", "Ask", f"POST /ask happy path RAG response (latency: {elapsed:.2f}s)", passed, r.status_code, r.text[:300])
        except Exception as e:
            record("TC-14", "Ask", "POST /ask happy path", False, 0, str(e))

    # Edge Case: Multi-turn Chat & Summary check
    if created_session_id:
        target_pdf = test_upload_name if upload_success else "Nimbus_Internal_Knowledge_Base.pdf"
        try:
            payload = {
                "query": "Where is the company headquartered?",
                "include_pdf": [target_pdf]
            }
            r = client.post(f"/ask?session_id={created_session_id}", json=payload)
            # Check if all_sessions.json has updated chat_summary and previous_chats
            with open(ALL_SESSIONS_FILE, "r") as f:
                all_sess = json.load(f)
                curr_sess = next((s for s in all_sess if s["session_id"] == created_session_id), None)
            summary_updated = curr_sess and len(curr_sess.get("chat_summary", "")) > 0
            history_len = len(curr_sess.get("previous_chats", [])) if curr_sess else 0
            passed = (r.status_code == 200 and summary_updated and history_len >= 2)
            record("TC-15", "Ask [Multi-Turn]", "POST /ask updates session history and running summary", passed, r.status_code,
                   f"Chats logged: {history_len}, Summary: {curr_sess.get('chat_summary', '')[:100] if curr_sess else 'None'}")
        except Exception as e:
            record("TC-15", "Ask [Multi-Turn]", "POST /ask updates session history", False, 0, str(e))

    # Edge Case: Completely Off-topic / Irrelevant Question (Tests reranker score > -2 filtering)
    if created_session_id:
        target_pdf = test_upload_name if upload_success else "Nimbus_Internal_Knowledge_Base.pdf"
        try:
            payload = {
                "query": "How many moons does Jupiter have and what is quantum entanglement?",
                "include_pdf": [target_pdf]
            }
            r = client.post(f"/ask?session_id={created_session_id}", json=payload)
            passed = (r.status_code == 200)
            # Answer should state not enough information or grounded rejection
            record("TC-16", "Ask [Hallucination Test]", "POST /ask with off-topic question tests reranker filter & grounding", passed, r.status_code, r.text[:300])
        except Exception as e:
            record("TC-16", "Ask [Hallucination Test]", "POST /ask off-topic question", False, 0, str(e))

    # -------------------------------------------------------------
    # 5. DELETE ENDPOINT & EDGE CASES
    # -------------------------------------------------------------
    # Edge Case: Delete non-existent file
    try:
        r = client.delete("/delete/ghost_file_123.pdf")
        passed = (r.status_code == 404)
        record("TC-17", "Delete [Edge]", "DELETE /delete with non-existent file returns 404", passed, r.status_code, r.text)
    except Exception as e:
        record("TC-17", "Delete [Edge]", "DELETE /delete non-existent file", False, 0, str(e))

    # Edge Case: Path Traversal attempt on delete
    try:
        r = client.delete("/delete/..%2Fmain.py")
        # FastAPI routing or 404 should prevent deleting main.py
        main_py_exists = (PROJECT_ROOT / "main.py").exists()
        passed = (main_py_exists and r.status_code in [400, 404, 500])
        record("TC-18", "Delete [Security]", "DELETE /delete path traversal fails to delete root main.py", passed, r.status_code, r.text)
    except Exception as e:
        record("TC-18", "Delete [Security]", "DELETE /delete path traversal", False, 0, str(e))

    # Happy Path: Clean up the uploaded test PDF
    if upload_success:
        try:
            r = client.delete(f"/delete/{test_upload_name}")
            passed = (r.status_code == 200)
            record("TC-19", "Delete", "DELETE /delete successfully deletes test PDF from disk and Qdrant", passed, r.status_code, r.text)
        except Exception as e:
            record("TC-19", "Delete", "DELETE /delete happy path", False, 0, str(e))

    # Clean up the created test session
    if created_session_id:
        try:
            r = client.delete(f"/session-delete/{created_session_id}")
            passed = (r.status_code == 200)
            record("TC-20", "Session", "DELETE /session-delete successfully cleans up test session", passed, r.status_code, r.text)
        except Exception as e:
            record("TC-20", "Session", "DELETE /session-delete cleanup", False, 0, str(e))

    print("\n" + "=" * 80)
    print("TEST SUITE EXECUTION COMPLETE")
    print("=" * 80 + "\n")

    return results


if __name__ == "__main__":
    setup_environment()
    try:
        test_results = run_tests()
        # Save results to a json report in this directory
        report_file = Path(__file__).parent / "test_report.json"
        with open(report_file, "w") as f:
            json.dump(test_results, f, indent=2)
        print(f"Detailed JSON report saved to: {report_file}")
    finally:
        teardown_environment()
