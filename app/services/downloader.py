import os
import re
from pathlib import Path
from typing import Dict, Any, Optional
import yt_dlp


def sanitize_filename(name: str) -> str:
    """파일명으로 사용 불가능한 특수문자 제거"""
    return re.sub(r'[\\/*?:"<>|]', "_", name).strip()


def extract_youtube_id(url: str) -> Optional[str]:
    """유튜브 URL에서 비디오 ID를 빠르게 추출"""
    if not url:
        return None
    patterns = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",
        r"youtu\.be\/([0-9A-Za-z_-]{11})",
        r"shorts\/([0-9A-Za-z_-]{11})",
        r"embed\/([0-9A-Za-z_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def format_duration(seconds: Optional[int]) -> str:
    """초 단위를 MM:SS 또는 HH:MM:SS 형식으로 변환"""
    if not seconds:
        return "00:00"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def get_video_info(url: str) -> Dict[str, Any]:
    """유튜브 비디오 메타데이터를 다운로드 없이 빠르게 추출"""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": False,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            "id": info.get("id", ""),
            "title": info.get("title", "제목 없음"),
            "uploader": info.get("uploader", info.get("channel", "알 수 없는 채널")),
            "duration": info.get("duration", 0),
            "duration_string": format_duration(info.get("duration", 0)),
            "thumbnail": info.get("thumbnail", ""),
            "webpage_url": info.get("webpage_url", url),
            "description": (info.get("description", "") or "")[:300],
        }


def download_audio(
    url: str,
    output_dir: str = "downloads",
    progress_callback: Optional[callable] = None,
) -> Dict[str, Any]:
    """
    유튜브 영상의 오디오를 MP3 파일로 다운로드합니다.
    """
    os.makedirs(output_dir, exist_ok=True)

    # 진행률 콜백 래퍼
    def ydl_hook(d):
        if progress_callback and d["status"] == "downloading":
            total_bytes = d.get("total_bytes") or d.get("total_bytes_estimate", 0)
            downloaded = d.get("downloaded_bytes", 0)
            percent = (downloaded / total_bytes * 100) if total_bytes > 0 else 0
            progress_callback(percent, "오디오 다운로드 중...")
        elif progress_callback and d["status"] == "finished":
            progress_callback(99, "오디오 인코딩 및 변환 중...")

    ydl_opts = {
        "format": "bestaudio/best",
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
        "outtmpl": os.path.join(output_dir, "%(id)s.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "progress_hooks": [ydl_hook],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        # 확장자가 mp3로 변환됨
        base, _ = os.path.splitext(filename)
        audio_path = f"{base}.mp3"

        return {
            "id": info.get("id", ""),
            "title": info.get("title", "제목 없음"),
            "uploader": info.get("uploader", info.get("channel", "알 수 없는 채널")),
            "duration": info.get("duration", 0),
            "duration_string": format_duration(info.get("duration", 0)),
            "thumbnail": info.get("thumbnail", ""),
            "webpage_url": info.get("webpage_url", url),
            "audio_path": audio_path,
            "audio_filename": os.path.basename(audio_path),
            "filesize": os.path.getsize(audio_path) if os.path.exists(audio_path) else 0,
        }
