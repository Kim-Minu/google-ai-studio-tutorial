# 🎙️ YouTube Audio & Transcript with Google Gemini

> **유튜브 영상의 오디오를 고음질로 추출하고, Google Gemini 멀티모달 AI를 활용하여 정밀 트랜스크립트(STT), 자동 요약 및 영상 기반 대화형 AI Q&A를 제공하는 올인원 웹 애플리케이션 & 튜토리얼 저장소입니다.**

---

## ✨ 주요 기능 (Key Features)

### 1. 🎥 유튜브 오디오 추출 & Gemini STT 전사
- **yt-dlp 기반 오디오 다운로드**: 유튜브 URL을 입력하면 자동으로 최고 음질의 오디오(MP3)를 추출하여 로컬에 캐싱합니다.
- **Gemini 멀티모달 오디오 분석**: Google GenAI SDK를 통해 오디오 파일을 직접 분석하여 정밀한 타임스탬프 자막 및 3줄 핵심 요약을 생성합니다.
- **지원 모델**: `gemini-3.7-flash`, `gemini-2.5-flash`, `gemini-2.5-pro` 등 최신 모델 선택 지원.

### 2. ⏱️ 타임스탬프 동기화 & 인터랙티브 플레이어
- **유튜브 플레이어 & 오디오 플레이어 연동**: 자막 타임스탬프(`[MM:SS]`)를 클릭하면 영상 및 오디오가 해당 재생 위치로 즉시 이동합니다.
- **실시간 텍스트 복사 & 다운로드**: 생성된 자막과 요약을 클립보드에 복사하거나 텍스트 파일로 저장할 수 있습니다.

### 3. 💬 영상 기반 인터랙티브 AI Q&A (챗봇)
- **대본 기반 질의응답**: 영상의 전체 트랜스크립트를 컨텍스트로 학습하여 질문에 대한 정확한 답변과 근거 타임스탬프를 제공합니다.
- **멀티턴 대화 지원**: 이전 대화 맥락을 유지하여 심층적인 질의응답이 가능합니다.

### 4. 🗂️ 히스토리 관리 & 로컬 캐싱
- **빠른 재조회**: 이미 분석한 영상은 다운로드 및 API 중복 호출 없이 즉시 히스토리 캐시에서 불러옵니다.
- **히스토리 드로어**: 분석했던 영상 목록을 확인하고 개별 삭제 또는 전체 삭제가 가능합니다.

### 5. 📚 Google AI Studio 예제 스크립트 (STT / TTS)
- [`STT/gemini-3.5-transcrib.py`](STT/gemini-3.5-transcrib.py): 오디오 파일 직접 입력, 화자 분리(Diarization), 단어별 타임스탬프 전사 예제.
- [`TTS/gemini-3.1-flash-tts-preview.py`](TTS/gemini-3.1-flash-tts-preview.py): 상황/감정 태그 기반 음성 합성 및 44바이트 표준 RIFF/WAVE 파일 변환 예제.

---

## 🏗️ 프로젝트 구조 (Project Structure)

```text
google-ai-studio-tutorial/
├── app/                        # FastAPI 웹 애플리케이션
│   ├── main.py                 # FastAPI 엔드포인트 & 라우팅
│   ├── services/               # 비즈니스 로직 모듈
│   │   ├── downloader.py       # yt-dlp 오디오 다운로더
│   │   ├── transcriber.py      # Gemini STT 및 AI Q&A 서비스
│   │   └── history.py          # JSON 기반 히스토리 로컬 캐시
│   ├── static/                 # 프론트엔드 정적 리소스
│   │   ├── css/style.css       # 반응형 & 모던 UI 스타일시트
│   │   └── js/app.js           # UI 인터랙션, 비동기 통신, 플레이어 동기화
│   └── templates/              # HTML 템플릿
│       └── index.html          # 메인 대시보드 인터페이스
├── STT/                        # Speech-to-Text 독립 예제
│   ├── gemini-3.5-transcrib.py # Gemini STT 스크립트
│   └── README.md               # 라인 바이 라인 코드 해설
├── TTS/                        # Text-to-Speech 독립 예제
│   ├── gemini-3.1-flash-tts-preview.py # Gemini TTS 스크립트
│   └── README.md               # 라인 바이 라인 코드 해설
├── downloads/                  # 추출된 오디오 및 캐시 저장소
├── run.py                      # 웹 서버 실행 스크립트
├── requirements.txt            # Python 의존성 목록
├── .env.example                # 환경 변수 예시 파일
└── LICENSES_GUIDE.md           # 라이선스 안내 문서
```

---

## 🚀 빠른 시작 (Getting Started)

### 1. 사전 요구사항
- **Python 3.10 이상**
- **FFmpeg** (오디오 추출에 필요):
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: `winget install Gyan.FFmpeg` 또는 공식 홈페이지에서 다운로드
- **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/)에서 무료 발급)

### 2. 가상환경 생성 및 의존성 설치

```bash
# 가상환경 생성
python3 -m venv .venv

# 가상환경 활성화 (macOS/Linux)
source .venv/bin/activate

# (Windows의 경우: .venv\Scripts\activate)

# 패키지 설치
pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 Gemini API 키를 입력합니다:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```env
GEMINI_API_KEY=your_gemini_api_key_here
HOST=0.0.0.0
PORT=8000
```

> **참고**: `.env`에 키를 설정하지 않아도, 웹 UI 상단의 API 키 입력창에서 직접 입력하여 사용할 수 있습니다.

---

## 🖥️ 웹 서비스 실행

### 실행 방법 1: `run.py` 실행
```bash
python run.py
```

### 실행 방법 2: `uvicorn` 직접 실행
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

서버가 구동되면 브라우저에서 아래 주소로 접속합니다:
- **로컬 접속**: [`http://localhost:8000`](http://localhost:8000)
- **동일 네트워크(모바일 등)**: `http://[내부_IP_주소]:8000` (예: `http://192.168.14.238:8000`)

---

## 📡 API 엔드포인트 요약

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/` | 메인 대시보드 웹 인터페이스 |
| `POST` | `/api/info` | 유튜브 영상 기본 메타데이터 조회 (제목, 채널, 썸네일 등) |
| `POST` | `/api/transcribe` | 오디오 다운로드 + Gemini STT 전사 및 요약 수행 |
| `POST` | `/api/qa` | 영상 트랜스크립트 기반 대화형 AI 질의응답 |
| `GET` | `/api/audio/{filename}` | 다운로드된 오디오 파일 스트리밍 서빙 |
| `GET` | `/api/history` | 로컬 분석 히스토리 목록 조회 |
| `DELETE` | `/api/history/{video_id}` | 특정 히스토리 항목 삭제 |
| `DELETE` | `/api/history` | 전체 히스토리 초기화 |
| `GET` | `/api/health` | 서비스 및 API Key 설정 상태 확인 |

---

## 📖 튜토리얼 서브 문서
- 🎙️ [STT 상세 가이드 (`STT/README.md`)](STT/README.md): Gemini 전사 스크립트 코드 분석 및 옵션 가이드
- 🔊 [TTS 상세 가이드 (`TTS/README.md`)](TTS/README.md): Gemini 음성 합성 및 WAV 변환 로직 분석
- 📜 [라이선스 가이드 (`LICENSES_GUIDE.md`)](LICENSES_GUIDE.md): 오픈소스 라이선스 및 준수 가이드

---

## 📄 라이선스 (License)

본 프로젝트는 [MIT License](LICENSE)를 따릅니다.
