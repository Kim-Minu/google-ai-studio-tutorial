import os
import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types


def get_gemini_client(api_key: Optional[str] = None) -> genai.Client:
    """Gemini API 클라이언트 인스턴스 생성"""
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ValueError(
            "Gemini API 키가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 설정하거나 웹 화면에서 입력해주세요."
        )
    return genai.Client(api_key=key)


def convert_seconds_to_srt_time(seconds: float) -> str:
    """초 단위를 SRT 타임스탬프 형식(00:00:00,000)으로 변환"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def convert_seconds_to_vtt_time(seconds: float) -> str:
    """초 단위를 VTT 타임스탬프 형식(00:00:00.000)으로 변환"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def generate_srt_content(segments: List[Dict[str, Any]]) -> str:
    """세그먼트 목록을 SRT 자막 파일 문자열로 변환"""
    srt_lines = []
    for idx, seg in enumerate(segments, start=1):
        start_time = seg.get("start", "00:00:00,000")
        end_time = seg.get("end", "00:00:05,000")
        speaker = seg.get("speaker", "")
        text = seg.get("text", "").strip()

        prefix = f"[{speaker}] " if speaker and speaker != "화자" else ""
        srt_lines.append(f"{idx}\n{start_time} --> {end_time}\n{prefix}{text}\n")
    return "\n".join(srt_lines)


def generate_vtt_content(segments: List[Dict[str, Any]]) -> str:
    """세그먼트 목록을 WebVTT 자막 파일 문자열로 변환"""
    vtt_lines = ["WEBVTT\n"]
    for idx, seg in enumerate(segments, start=1):
        start_time = seg.get("start", "00:00:00.000").replace(",", ".")
        end_time = seg.get("end", "00:00:05.000").replace(",", ".")
        speaker = seg.get("speaker", "")
        text = seg.get("text", "").strip()

        prefix = f"<v {speaker}>" if speaker and speaker != "화자" else ""
        suffix = f"</v>" if prefix else ""
        vtt_lines.append(f"{idx}\n{start_time} --> {end_time}\n{prefix}{text}{suffix}\n")
    return "\n".join(vtt_lines)


def generate_plain_text(segments: List[Dict[str, Any]]) -> str:
    """세그먼트 목록을 일반 읽기용 텍스트로 변환"""
    lines = []
    for seg in segments:
        time_str = seg.get("timestamp", seg.get("start", ""))
        speaker = seg.get("speaker", "")
        text = seg.get("text", "").strip()
        header = f"[{time_str}] {speaker}: " if speaker else f"[{time_str}] "
        lines.append(f"{header}{text}")
    return "\n\n".join(lines)


def transcribe_audio_with_gemini(
    audio_path: str,
    api_key: Optional[str] = None,
    model_name: str = "gemini-3.7-flash",
    language_hint: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Google GenAI SDK를 사용하여 오디오 파일에서 트랜스크립트 및 요약을 추출합니다.
    """
    client = get_gemini_client(api_key)
    file_path = Path(audio_path)
    if not file_path.exists():
        raise FileNotFoundError(f"오디오 파일을 찾을 수 없습니다: {audio_path}")

    filesize_mb = file_path.stat().st_size / (1024 * 1024)

    import mimetypes
    mime_type, _ = mimetypes.guess_type(audio_path)
    if not mime_type or not mime_type.startswith("audio/"):
        ext = file_path.suffix.lower()
        if ext == ".mp3":
            mime_type = "audio/mpeg"
        elif ext == ".wav":
            mime_type = "audio/wav"
        elif ext == ".m4a":
            mime_type = "audio/m4a"
        else:
            mime_type = "audio/mpeg"

    # 20MB 초과 시 Files API 사용, 미만일 경우 Files API 또는 직접 바이트 전달
    uploaded_file = None
    try:
        # HTTP Header 인코딩(ASCII) 오류 방지를 위해 display_name은 ASCII 문자열로 전달
        safe_display_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", file_path.name)
        if not safe_display_name or safe_display_name.strip("._") == "":
            safe_display_name = "audio_file.mp3"

        uploaded_file = client.files.upload(
            file=file_path,
            config=types.UploadFileConfig(
                display_name=safe_display_name,
                mime_type=mime_type,
            ),
        )

        prompt = f"""
당신은 최고의 음성 인식 및 자막 전문가입니다.
제공된 오디오를 듣고 한국어(또는 원어 음성)에 맞춰 매우 정밀하게 음성을 텍스트로 전사하고 요약해주세요.

다음 JSON 스키마 형식에 맞춰 오직 순수 JSON 데이터(코드블록 없이)만 반환하세요:
{{
  "summary": "영상/음성의 핵심 내용을 3~4문장으로 명확히 요약",
  "key_points": [
    "핵심 포인트 1",
    "핵심 포인트 2",
    "핵심 포인트 3"
  ],
  "detected_language": "감지된 주 언어 (예: 한국어, 영어, 일본어 등)",
  "segments": [
    {{
      "start": "00:00:00,000",
      "end": "00:00:04,500",
      "timestamp": "00:00",
      "seconds": 0.0,
      "speaker": "화자1",
      "text": "말한 내용 텍스트"
    }}
  ]
}}

[작성 지침]
1. segments의 start, end는 SRT 자막 포맷(HH:MM:SS,mmm)을 정확히 지켜주세요.
2. timestamp는 플레이어 점프용 포맷(MM:SS 또는 HH:MM:SS)으로 작성하고 seconds는 시작 초(float/int)를 넣으세요.
3. 화자(speaker)는 음색/화자에 따라 '화자1', '화자2' 또는 호칭으로 분리해주세요.
4. 오디오의 모든 문장을 빠짐없이 정확하게 전사하세요.
5. {f'주요 언어 힌트: {language_hint}' if language_hint else '자동 언어 감지 적용'}
"""

        # Gemini 호출
        response = client.models.generate_content(
            model=model_name,
            contents=[uploaded_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

        raw_text = response.text.strip()
        # 마크다운 코드블록 제거 처리 (혹시 포함된 경우)
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?\n", "", raw_text)
            raw_text = re.sub(r"\n```$", "", raw_text)

        result_data = json.loads(raw_text)

        segments = result_data.get("segments", [])
        srt_content = generate_srt_content(segments)
        vtt_content = generate_vtt_content(segments)
        plain_text = generate_plain_text(segments)

        return {
            "summary": result_data.get("summary", ""),
            "key_points": result_data.get("key_points", []),
            "detected_language": result_data.get("detected_language", "알 수 없음"),
            "segments": segments,
            "full_text": plain_text,
            "srt": srt_content,
            "vtt": vtt_content,
        }

    finally:
        # 업로드된 임시 파일 정리
        if uploaded_file and hasattr(uploaded_file, "name"):
            try:
                client.files.delete(name=uploaded_file.name)
            except Exception:
                pass


def ask_transcript_qa(
    question: str,
    transcript_text: str,
    video_title: str = "",
    uploader: str = "",
    history: Optional[List[Dict[str, str]]] = None,
    api_key: Optional[str] = None,
    model_name: str = "gemini-3.7-flash",
) -> str:
    """
    영상 트랜스크립트 맥락을 기반으로 사용자의 질문에 답변합니다.
    """
    client = get_gemini_client(api_key=api_key)

    system_instruction = (
        "당신은 유튜브 영상의 내용을 깊이 이해하고 사용자의 질문에 친절하고 명확하게 답변하는 AI 어시스턴트입니다.\n"
        "제공된 영상 스크립트와 메타데이터를 기반으로 사실에 입각하여 성실하게 답변하세요.\n"
        "규칙:\n"
        "1. 한국어로 자연스럽고 가독성 좋게 답변하세요 (필요시 글머리 기호 사용).\n"
        "2. 답변에서 스크립트의 특정 시점을 인용하거나 언급할 때는 반드시 `[MM:SS]` 형식(예: `[00:15]`, `[01:30]`)으로 타임스탬프를 적어주세요. 사용자가 이를 클릭하여 바로 해당 시점으로 이동할 수 있습니다.\n"
        "3. 스크립트에 전혀 언급되지 않은 내용이라면 솔직하게 영상에 언급되지 않았음을 밝히세요.\n"
    )

    context_prompt = (
        f"【영상 정보】\n"
        f"- 제목: {video_title}\n"
        f"- 게시자: {uploader}\n\n"
        f"【영상 전체 스크립트】\n"
        f"{transcript_text}\n\n"
        f"---"
    )

    contents = [context_prompt]

    # 이전 대화 히스토리 포함
    if history:
        for turn in history[-6:]: # 최근 3회 왕복
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role == "user":
                contents.append(f"사용자 질문: {content}")
            else:
                contents.append(f"AI 답변: {content}")

    contents.append(f"사용자 질문: {question}\n\n답변:")

    full_prompt = "\n\n".join(contents)

    response = client.models.generate_content(
        model=model_name,
        contents=full_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.3,
        ),
    )

    return (response.text or "").strip()

