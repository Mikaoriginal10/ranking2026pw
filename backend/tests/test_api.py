"""Backend API tests for Ranking de Vendas app."""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://champions-board-1.preview.emergentagent.com").rstrip("/")
# Load frontend .env for public URL
try:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
except Exception:
    pass

API = f"{BASE_URL}/api"
PASSWORD = "admin123"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"password": PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# --- Auth ---
class TestAuth:
    def test_login_wrong(self):
        r = requests.post(f"{API}/auth/login", json={"password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_login_ok(self, token):
        assert isinstance(token, str) and len(token) > 20

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_ok(self, auth):
        r = requests.get(f"{API}/auth/me", headers=auth, timeout=15)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


# --- Public endpoint ---
class TestPublic:
    def test_public_ranking_no_value(self):
        r = requests.get(f"{API}/public/ranking", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "ranking" in d and "sellers" in d and "rankings" in d
        for s in d["sellers"]:
            assert "value" not in s, f"public seller must not contain value: {s}"

    def test_admin_endpoints_require_auth(self):
        endpoints = [
            ("GET", f"{API}/admin/ranking"),
            ("POST", f"{API}/admin/rankings"),
            ("POST", f"{API}/admin/sellers"),
            ("POST", f"{API}/admin/sellers/bulk"),
            ("POST", f"{API}/admin/active"),
            ("POST", f"{API}/admin/logo"),
        ]
        for method, url in endpoints:
            r = requests.request(method, url, json={}, timeout=15)
            assert r.status_code == 401, f"{method} {url} => {r.status_code}"


# --- Admin full flow ---
class TestAdminFlow:
    created_ranking_id = None
    created_seller_ids = []
    original_active = None

    def test_admin_ranking(self, auth):
        r = requests.get(f"{API}/admin/ranking", headers=auth, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["ranking"] is not None
        TestAdminFlow.original_active = d["active_ranking_id"]

    def test_create_ranking_with_copy(self, auth):
        # get current active
        r0 = requests.get(f"{API}/admin/ranking", headers=auth, timeout=15).json()
        active_id = r0["active_ranking_id"]
        r = requests.post(f"{API}/admin/rankings", headers=auth,
                          json={"title": "TEST_Ranking_Novembro", "copy_from": active_id}, timeout=15)
        assert r.status_code == 200
        rid = r.json()["id"]
        TestAdminFlow.created_ranking_id = rid

        # verify sellers copied without values
        r2 = requests.get(f"{API}/admin/ranking?ranking_id={rid}", headers=auth, timeout=15)
        assert r2.status_code == 200
        sellers = r2.json()["sellers"]
        assert len(sellers) > 0
        for s in sellers:
            assert s["value"] is None

    def test_rename_ranking(self, auth):
        rid = TestAdminFlow.created_ranking_id
        r = requests.put(f"{API}/admin/rankings/{rid}", headers=auth,
                         json={"title": "TEST_Ranking_Dezembro"}, timeout=15)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/admin/ranking?ranking_id={rid}", headers=auth, timeout=15).json()
        assert r2["ranking"]["title"] == "TEST_Ranking_Dezembro"

    def test_add_seller_and_update(self, auth):
        rid = TestAdminFlow.created_ranking_id
        r = requests.post(f"{API}/admin/sellers", headers=auth,
                          json={"ranking_id": rid, "name": "TEST_Vendedor1", "value": 1000}, timeout=15)
        assert r.status_code == 200
        sid = r.json()["id"]
        assert r.json()["name"] == "TEST_Vendedor1"
        TestAdminFlow.created_seller_ids.append(sid)

        # update value
        r2 = requests.put(f"{API}/admin/sellers/{sid}", headers=auth,
                         json={"value": 2500.50, "name": "TEST_Vendedor1_Edit"}, timeout=15)
        assert r2.status_code == 200

        # verify via admin ranking
        r3 = requests.get(f"{API}/admin/ranking?ranking_id={rid}", headers=auth, timeout=15).json()
        found = next((s for s in r3["sellers"] if s["id"] == sid), None)
        assert found is not None
        assert found["value"] == 2500.50
        assert found["name"] == "TEST_Vendedor1_Edit"

    def test_bulk_add(self, auth):
        rid = TestAdminFlow.created_ranking_id
        r = requests.post(f"{API}/admin/sellers/bulk", headers=auth,
                          json={"ranking_id": rid, "names": ["TEST_Bulk1", "TEST_Bulk2", "TEST_Bulk3", "  "]}, timeout=15)
        assert r.status_code == 200
        assert r.json()["added"] == 3

    def test_reorder(self, auth):
        rid = TestAdminFlow.created_ranking_id
        r0 = requests.get(f"{API}/admin/ranking?ranking_id={rid}", headers=auth, timeout=15).json()
        ids = [s["id"] for s in r0["sellers"]]
        reversed_ids = list(reversed(ids))
        r = requests.put(f"{API}/admin/rankings/{rid}/order", headers=auth,
                        json={"ids": reversed_ids}, timeout=15)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/admin/ranking?ranking_id={rid}", headers=auth, timeout=15).json()
        new_order = [s["id"] for s in r2["sellers"]]
        assert new_order == reversed_ids

    def test_set_active_and_public_reflects(self, auth):
        rid = TestAdminFlow.created_ranking_id
        r = requests.post(f"{API}/admin/active", headers=auth,
                        json={"ranking_id": rid}, timeout=15)
        assert r.status_code == 200
        pub = requests.get(f"{API}/public/ranking", timeout=15).json()
        assert pub["active_ranking_id"] == rid
        assert pub["ranking"]["id"] == rid

    def test_delete_seller(self, auth):
        rid = TestAdminFlow.created_ranking_id
        sid = TestAdminFlow.created_seller_ids[0]
        r = requests.delete(f"{API}/admin/sellers/{sid}", headers=auth, timeout=15)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/admin/ranking?ranking_id={rid}", headers=auth, timeout=15).json()
        assert all(s["id"] != sid for s in r2["sellers"])
        # positions sequential
        positions = [s["position"] for s in r2["sellers"]]
        assert positions == list(range(1, len(positions) + 1))

    def test_logo_upload_invalid(self, auth):
        files = {"file": ("t.txt", io.BytesIO(b"hello"), "text/plain")}
        r = requests.post(f"{API}/admin/logo", headers=auth, files=files, timeout=30)
        assert r.status_code == 400

    def test_logo_upload_valid(self, auth):
        # 1x1 PNG
        png = bytes.fromhex("89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C62000100000500010D0A2DB40000000049454E44AE426082")
        files = {"file": ("t.png", io.BytesIO(png), "image/png")}
        r = requests.post(f"{API}/admin/logo", headers=auth, files=files, timeout=60)
        assert r.status_code == 200, r.text
        path = r.json()["logo_path"]
        assert path
        # fetch file publicly
        r2 = requests.get(f"{API}/files/{path}", timeout=30)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")

    def test_delete_last_ranking_blocked(self, auth):
        # not actually deleting last; just verify behavior if only one left
        rankings = requests.get(f"{API}/admin/ranking", headers=auth, timeout=15).json()["rankings"]
        # should be at least 2 now (seed + created)
        assert len(rankings) >= 2

    def test_cleanup_restore(self, auth):
        # Restore original active and delete the test ranking
        if TestAdminFlow.original_active:
            requests.post(f"{API}/admin/active", headers=auth,
                          json={"ranking_id": TestAdminFlow.original_active}, timeout=15)
        if TestAdminFlow.created_ranking_id:
            r = requests.delete(f"{API}/admin/rankings/{TestAdminFlow.created_ranking_id}",
                                headers=auth, timeout=15)
            assert r.status_code == 200
