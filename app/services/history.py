import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
HISTORY_FILE = BASE_DIR.parent / "downloads" / "history.json"


def _ensure_history_file():
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not HISTORY_FILE.exists():
        HISTORY_FILE.write_text("[]", encoding="utf-8")


def get_all_history() -> List[Dict[str, Any]]:
    """모든 히스토리 항목을 최신순으로 가져옵니다."""
    _ensure_history_file()
    try:
        data = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []


def save_history_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """새 히스토리 항목을 저장하거나 기존 항목을 업데이트합니다."""
    _ensure_history_file()
    history = get_all_history()

    # 타임스탬프 추가
    entry["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 기존 동일 video_id 항목 제거 후 맨 앞에 삽입
    video_id = entry.get("video", {}).get("id")
    if video_id:
        history = [h for h in history if h.get("video", {}).get("id") != video_id]

    history.insert(0, entry)

    # 최대 50개 유지
    history = history[:50]

    HISTORY_FILE.write_text(
        json.dumps(history, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return entry


def get_history_by_id(video_id: str) -> Optional[Dict[str, Any]]:
    """특정 video_id의 히스토리 상세 항목을 가져옵니다."""
    history = get_all_history()
    for item in history:
        if item.get("video", {}).get("id") == video_id:
            return item
    return None


def delete_history_entry(video_id: str) -> bool:
    """특정 항목을 히스토리에서 삭제합니다."""
    _ensure_history_file()
    history = get_all_history()
    new_history = [h for h in history if h.get("video", {}).get("id") != video_id]
    if len(new_history) != len(history):
        HISTORY_FILE.write_text(
            json.dumps(new_history, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return True
    return False


def clear_history() -> bool:
    """전체 히스토리를 초기화합니다."""
    _ensure_history_file()
    HISTORY_FILE.write_text("[]", encoding="utf-8")
    return True
