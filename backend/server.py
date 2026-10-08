from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import jwt
import requests
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI()
api = APIRouter(prefix="/api")

JWT_SECRET = os.environ['JWT_SECRET']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "ranking-vendas"
storage_key = None
ALLOWED_IMG = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------- Models ----------
class Ranking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    created_at: str = Field(default_factory=now_iso)


class Seller(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ranking_id: str
    name: str
    subtitle: str = ""
    value: Optional[float] = None
    photo_path: Optional[str] = None
    photo_url: Optional[str] = None
    position: int = 0


class LoginIn(BaseModel):
    password: str


class RankingIn(BaseModel):
    title: str
    copy_from: Optional[str] = None


class RankingUpdate(BaseModel):
    title: str


class SellerIn(BaseModel):
    ranking_id: str
    name: str
    subtitle: str = ""
    value: Optional[float] = None


class SellerUpdate(BaseModel):
    name: Optional[str] = None
    subtitle: Optional[str] = None
    value: Optional[float] = None


class BulkIn(BaseModel):
    ranking_id: str
    names: List[str]


class OrderIn(BaseModel):
    ids: List[str]


class ActiveIn(BaseModel):
    ranking_id: str


# ---------- Auth ----------
def require_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(authorization[7:], JWT_SECRET, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    return True


@api.post("/auth/login")
async def login(body: LoginIn):
    if not secrets.compare_digest(body.password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    token = jwt.encode({"role": "admin", "exp": datetime.now(timezone.utc) + timedelta(days=7)}, JWT_SECRET, algorithm="HS256")
    return {"token": token}


@api.get("/auth/me")
async def me(_=Depends(require_admin)):
    return {"role": "admin"}


# ---------- Helpers ----------
async def get_settings():
    s = await db.settings.find_one({"_id": "main"})
    return s or {}


async def list_rankings():
    docs = await db.rankings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Ranking(**d).model_dump() for d in docs]


async def list_sellers(ranking_id: str, include_values: bool):
    docs = await db.sellers.find({"ranking_id": ranking_id}, {"_id": 0}).sort("position", 1).to_list(2000)
    out = []
    for d in docs:
        s = Seller(**d).model_dump()
        if not include_values:
            s.pop("value", None)
        out.append(s)
    return out


async def build_payload(ranking_id: Optional[str], include_values: bool):
    settings = await get_settings()
    rankings = await list_rankings()
    active_id = settings.get("active_ranking_id")
    rid = ranking_id or active_id or (rankings[0]["id"] if rankings else None)
    ranking = next((r for r in rankings if r["id"] == rid), None)
    sellers = await list_sellers(rid, include_values) if ranking else []
    return {
        "ranking": ranking,
        "rankings": rankings,
        "active_ranking_id": active_id,
        "logo_path": settings.get("logo_path"),
        "sellers": sellers,
        "updated_at": settings.get("updated_at"),
    }


async def touch():
    await db.settings.update_one({"_id": "main"}, {"$set": {"updated_at": now_iso()}}, upsert=True)


async def read_image(file: UploadFile):
    ctype = file.content_type or ""
    if ctype not in ALLOWED_IMG:
        raise HTTPException(status_code=400, detail="Formato inválido. Use JPG, PNG, WEBP ou GIF")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Imagem muito grande (máx. 10MB)")
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ALLOWED_IMG[ctype]}"
    result = put_object(path, data, ctype)
    await db.files.insert_one({"id": str(uuid.uuid4()), "storage_path": result["path"], "original_filename": file.filename,
                               "content_type": ctype, "size": result.get("size"), "is_deleted": False, "created_at": now_iso()})
    return result["path"]


# ---------- Public ----------
@api.get("/public/ranking")
async def public_ranking(ranking_id: Optional[str] = None):
    return await build_payload(ranking_id, include_values=False)


@api.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    data, ctype = get_object(path)
    return Response(content=data, media_type=record.get("content_type", ctype), headers={"Cache-Control": "public, max-age=86400"})


# ---------- Admin ----------
@api.get("/admin/ranking")
async def admin_ranking(ranking_id: Optional[str] = None, _=Depends(require_admin)):
    return await build_payload(ranking_id, include_values=True)


@api.post("/admin/rankings")
async def create_ranking(body: RankingIn, _=Depends(require_admin)):
    r = Ranking(title=body.title.strip())
    await db.rankings.insert_one(r.model_dump())
    if body.copy_from:
        src = await db.sellers.find({"ranking_id": body.copy_from}, {"_id": 0}).sort("position", 1).to_list(2000)
        copies = [Seller(**{**Seller(**s).model_dump(), "id": str(uuid.uuid4()), "ranking_id": r.id, "value": None}).model_dump() for s in src]
        if copies:
            await db.sellers.insert_many(copies)
    await touch()
    return r.model_dump()


@api.put("/admin/rankings/{rid}")
async def update_ranking(rid: str, body: RankingUpdate, _=Depends(require_admin)):
    res = await db.rankings.update_one({"id": rid}, {"$set": {"title": body.title.strip()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ranking não encontrado")
    await touch()
    return {"ok": True}


@api.delete("/admin/rankings/{rid}")
async def delete_ranking(rid: str, _=Depends(require_admin)):
    if await db.rankings.count_documents({}) <= 1:
        raise HTTPException(status_code=400, detail="Mantenha pelo menos um ranking")
    await db.rankings.delete_one({"id": rid})
    await db.sellers.delete_many({"ranking_id": rid})
    s = await get_settings()
    if s.get("active_ranking_id") == rid:
        latest = (await list_rankings())[0]
        await db.settings.update_one({"_id": "main"}, {"$set": {"active_ranking_id": latest["id"]}}, upsert=True)
    await touch()
    return {"ok": True}


@api.post("/admin/active")
async def set_active(body: ActiveIn, _=Depends(require_admin)):
    if not await db.rankings.find_one({"id": body.ranking_id}):
        raise HTTPException(status_code=404, detail="Ranking não encontrado")
    await db.settings.update_one({"_id": "main"}, {"$set": {"active_ranking_id": body.ranking_id}}, upsert=True)
    await touch()
    return {"ok": True}


async def next_position(ranking_id: str):
    last = await db.sellers.find({"ranking_id": ranking_id}).sort("position", -1).limit(1).to_list(1)
    return (last[0]["position"] + 1) if last else 1


@api.post("/admin/sellers")
async def add_seller(body: SellerIn, _=Depends(require_admin)):
    s = Seller(ranking_id=body.ranking_id, name=body.name.strip(), subtitle=body.subtitle.strip(), value=body.value,
               position=await next_position(body.ranking_id))
    await db.sellers.insert_one(s.model_dump())
    await touch()
    return s.model_dump()


@api.post("/admin/sellers/bulk")
async def bulk_add(body: BulkIn, _=Depends(require_admin)):
    pos = await next_position(body.ranking_id)
    names = [n.strip() for n in body.names if n.strip()]
    docs = [Seller(ranking_id=body.ranking_id, name=n, position=pos + i).model_dump() for i, n in enumerate(names)]
    if docs:
        await db.sellers.insert_many(docs)
    await touch()
    return {"added": len(docs)}


@api.put("/admin/sellers/{sid}")
async def update_seller(sid: str, body: SellerUpdate, _=Depends(require_admin)):
    upd = body.model_dump(exclude_unset=True)
    res = await db.sellers.update_one({"id": sid}, {"$set": upd})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendedor não encontrado")
    await touch()
    return {"ok": True}


@api.delete("/admin/sellers/{sid}")
async def delete_seller(sid: str, _=Depends(require_admin)):
    s = await db.sellers.find_one({"id": sid})
    if not s:
        raise HTTPException(status_code=404, detail="Vendedor não encontrado")
    await db.sellers.delete_one({"id": sid})
    rest = await db.sellers.find({"ranking_id": s["ranking_id"]}).sort("position", 1).to_list(2000)
    for i, d in enumerate(rest):
        await db.sellers.update_one({"id": d["id"]}, {"$set": {"position": i + 1}})
    await touch()
    return {"ok": True}


@api.put("/admin/rankings/{rid}/order")
async def reorder(rid: str, body: OrderIn, _=Depends(require_admin)):
    for i, sid in enumerate(body.ids):
        await db.sellers.update_one({"id": sid, "ranking_id": rid}, {"$set": {"position": i + 1}})
    await touch()
    return {"ok": True}


@api.post("/admin/sellers/{sid}/photo")
async def upload_photo(sid: str, file: UploadFile = File(...), _=Depends(require_admin)):
    if not await db.sellers.find_one({"id": sid}):
        raise HTTPException(status_code=404, detail="Vendedor não encontrado")
    path = await read_image(file)
    await db.sellers.update_one({"id": sid}, {"$set": {"photo_path": path, "photo_url": None}})
    await touch()
    return {"photo_path": path}


@api.post("/admin/logo")
async def upload_logo(file: UploadFile = File(...), _=Depends(require_admin)):
    path = await read_image(file)
    await db.settings.update_one({"_id": "main"}, {"$set": {"logo_path": path}}, upsert=True)
    await touch()
    return {"logo_path": path}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

SEED_PHOTOS = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80",
    "https://images.unsplash.com/photo-1573497161161-c3e73707e25c?w=600&q=80",
    "https://images.unsplash.com/photo-1613496701765-97267d26e3df?w=600&q=80",
]
SEED_NAMES = ["Carlos Mendes", "Juliana Rocha", "Rafael Lima", "Ana Beatriz Souza", "Marcos Oliveira", "Patrícia Alves",
              "Thiago Ferreira", "Larissa Gomes", "Bruno Carvalho", "Fernanda Ribeiro", "Diego Martins", "Camila Santos"]


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    if await db.rankings.count_documents({}) == 0:
        r = Ranking(title="Ranking de Outubro")
        await db.rankings.insert_one(r.model_dump())
        sellers = [Seller(ranking_id=r.id, name=n, position=i + 1, photo_url=SEED_PHOTOS[i] if i < 3 else None).model_dump()
                   for i, n in enumerate(SEED_NAMES)]
        await db.sellers.insert_many(sellers)
        await db.settings.update_one({"_id": "main"}, {"$set": {"active_ranking_id": r.id, "updated_at": now_iso()}}, upsert=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
