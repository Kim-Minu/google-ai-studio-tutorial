import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, HttpUrl

from app.services.downloader import get_video_info, download_audio
from app.services.transcriber import transcribe_audio_with_gemini
from app.services.history import (
    get_all_history,
    save_history_entry,
    get_history_by_id,
    delete_history_entry,
    clear_history,
)

# 환경 변수 로드
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DOWNLOADS_DIR = BASE_DIR.parent / "downloads"
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="YouTube Audio & Transcript Web Service",
    description="유튜브 영상 오디오 다운로드 및 Gemini 기반 자막/트랜스크립트 추출 서비스",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 및 템플릿 설정
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


class VideoInfoRequest(BaseModel):
    url: str


class TranscribeRequest(BaseModel):
    url: str
    api_key: Optional[str] = None
    model_name: Optional[str] = "gemini-3.7-flash"
    language_hint: Optional[str] = None


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """메인 웹 대시보드 페이지"""
    has_api_key = bool(os.environ.get("GEMINI_API_KEY"))
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"has_env_key": has_api_key},
    )


@app.get("/api/health")
async def health_check():
    """서비스 상태 및 환경변수 설정 여부 확인"""
    return {
        "status": "ok",
        "has_gemini_api_key": bool(os.environ.get("GEMINI_API_KEY")),
    }


@app.get("/api/history")
async def fetch_history():
    """저장된 히스토리 목록 조회"""
    items = get_all_history()
    return {"success": True, "history": items}


@app.get("/api/history/{video_id}")
async def fetch_history_item(video_id: str):
    """특정 히스토리 항목 상세 조회"""
    item = get_history_by_id(video_id)
    if not item:
        raise HTTPException(status_code=404, detail="히스토리 항목을 찾을 수 없습니다.")
    return {"success": True, "data": item}


@app.delete("/api/history/{video_id}")
async def remove_history_item(video_id: str):
    """특정 히스토리 항목 삭제"""
    deleted = delete_history_entry(video_id)
    return {"success": deleted}


@app.delete("/api/history")
async def remove_all_history():
    """전체 히스토리 삭제"""
    clear_history()
    return {"success": True}


@app.post("/api/info")
async def fetch_video_info(payload: VideoInfoRequest):
    """유튜브 영상 메타데이터 미리보기"""
    try:
        info = get_video_info(payload.url.strip())
        return {"success": True, "data": info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"영상 정보를 불러올 수 없습니다: {str(e)}")


@app.post("/api/transcribe")
async def process_transcription(payload: TranscribeRequest):
    """
    1) 유튜브 영상에서 오디오를 다운로드 (MP3)
    2) Google Gemini API를 호출하여 정밀 트랜스크립트 및 요약 생성
    3) 히스토리에 자동 저장
    """
    url = payload.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="유튜브 URL을 입력해주세요.")

    api_key = payload.api_key.strip() if payload.api_key else os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API 키가 필요합니다. 환경변수 GEMINI_API_KEY를 설정하거나 상단에 입력해주세요.",
        )

    try:
        # 1. 오디오 다운로드
        download_result = download_audio(url=url, output_dir=str(DOWNLOADS_DIR))
        audio_path = download_result["audio_path"]
        audio_filename = download_result["audio_filename"]

        # 2. Gemini STT 및 요약 추출
        transcript_result = transcribe_audio_with_gemini(
            audio_path=audio_path,
            api_key=api_key,
            model_name=payload.model_name or "gemini-3.7-flash",
            language_hint=payload.language_hint,
        )

        response_payload = {
            "success": True,
            "video": {
                "id": download_result["id"],
                "title": download_result["title"],
                "uploader": download_result["uploader"],
                "duration": download_result["duration"],
                "duration_string": download_result["duration_string"],
                "thumbnail": download_result["thumbnail"],
                "audio_url": f"/api/audio/{audio_filename}",
                "audio_filename": audio_filename,
                "url": url,
            },
            "transcript": transcript_result,
        }

        # 3. 히스토리에 자동 저장
        save_history_entry(response_payload)

        return response_payload

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"처리 중 오류가 발생했습니다: {str(e)}")


@app.get("/api/audio/{filename}")
async def serve_audio(filename: str):
    """다운로드된 오디오 파일 스트리밍 및 서빙"""
    file_path = DOWNLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="오디오 파일을 찾을 수 없습니다.")
    return FileResponse(
        path=str(file_path),
        media_type="audio/mpeg",
        filename=filename,
    )
