# STT (Speech-to-Text): `gemini-3.5-transcrib.py` 라인 바이 라인 가이드

이 문서는 Google GenAI SDK(`google-genai`)를 활용하여 오디오 파일(`output.wav`)을 텍스트로 변환(전사)하고, 화자 분리(Diarization) 및 단어별 타임스탬프를 추출하는 `gemini-3.5-transcrib.py` 소스코드를 한 줄씩 상세하게 설명합니다.

---

## 📌 주요 기능
- **WAV 오디오 파일 직접 입력**: `types.Part.from_bytes()`를 사용하여 바이너리 오디오를 모델에 전송
- **실시간 스트리밍 출력**: `client.models.generate_content_stream()`을 통한 토큰 단위 즉시 출력
- **고급 전사 옵션**: 단어 단위 타임스탬프(`word_timestamp=True`), 다중 화자 분리(`diarization=True`)

---

## 🔍 라인 바이 라인 코드 해설

### 1. 의존성 및 모듈 임포트

```python
1: # To run this code you need to install the following dependencies:
2: # pip install google-genai
3: 
```
* **Line 1~2**: 필요한 패키지 설치 안내 주석입니다. 신규 Google GenAI SDK인 `google-genai`가 필요합니다.
* **Line 3**: 가독성을 위한 빈 줄입니다.

```python
4: import os
5: from pathlib import Path
6: from google import genai
7: from google.genai import types
8: 
9: 
```
* **Line 4 (`import os`)**: 환경변수(`GEMINI_API_KEY`)를 읽어오기 위한 표준 라이브러리입니다.
* **Line 5 (`from pathlib import Path`)**: 파일 경로 검사 및 바이너리 데이터를 간편하게 읽기 위해 `Path` 클래스를 가져옵니다.
* **Line 6 (`from google import genai`)**: Google GenAI SDK의 최상위 클라이언트 인터페이스를 임포트합니다.
* **Line 7 (`from google.genai import types`)**: API 요청 및 설정에 사용되는 다양한 타입 클래스(Content, Part, GenerateContentConfig 등)를 가져옵니다.
* **Line 8~9**: 함수 정의 전 공백 라인입니다.

---

### 2. 함수 정의 및 API 클라이언트 초기화

```python
10: def generate(audio_path: str = "output.wav"):
11:     client = genai.Client(
12:         api_key=os.environ.get("GEMINI_API_KEY"),
13:     )
14: 
```
* **Line 10**: `generate(audio_path: str = "output.wav")`
  * 음성 전사를 수행하는 메인 함수입니다. 기본 파일 경로로 `"output.wav"`를 전달받습니다.
* **Line 11~13**: `client = genai.Client(...)`
  * 환경변수 `GEMINI_API_KEY`에 설정된 API 키를 사용하여 Google GenAI 클라이언트를 초기화합니다.
* **Line 14**: 공백 라인입니다.

---

### 3. 오디오 파일 유효성 검사 및 데이터 로드

```python
15:     audio_file = Path(audio_path)
16:     if not audio_file.exists():
17:         raise FileNotFoundError(f"Audio file not found: {audio_path}")
18: 
19:     audio_bytes = audio_file.read_bytes()
20: 
```
* **Line 15**: 입력받은 경로 문자열로 `Path` 객체를 생성합니다.
* **Line 16~17**: 지정된 파일이 실제로 존재하는지 확인하며, 없으면 `FileNotFoundError`를 발생시켜 중단합니다.
* **Line 19**: 파일 전체를 바이너리 바이트(`bytes`) 형태로 읽어 `audio_bytes`에 저장합니다.
* **Line 20**: 공백 라인입니다.

---

### 4. 모델 지정 및 멀티모달 입력 구성

```python
21:     model = "gemini-3.5-transcribe"
22:     contents = [
23:         types.Content(
24:             role="user",
25:             parts=[
26:                 types.Part.from_bytes(
27:                     data=audio_bytes,
28:                     mime_type="audio/wav",
29:                 ),
30:                 types.Part.from_text(text="Transcribe the following audio."),
31:             ],
32:         ),
33:     ]
```
* **Line 21**: 전사 작업을 수행할 모델명(`gemini-3.5-transcribe`)을 지정합니다.
* **Line 22~33**: 모델에 전송할 멀티모달 컨텐츠를 구성합니다.
  * **Line 24**: 사용자의 요청임을 나타내는 `role="user"` 설정입니다.
  * **Line 26~29**: `types.Part.from_bytes()`를 사용하여 읽어온 WAV 파일의 바이너리 데이터(`audio_bytes`)와 MIME 타입(`audio/wav`)을 입력 파트로 생성합니다.
  * **Line 30**: 오디오에 대한 처리 지시 텍스트("Transcribe the following audio.")를 함께 전달합니다.

---

### 5. 전사 설정 (화자 분리 및 타임스탬프)

```python
34:     generate_content_config = types.GenerateContentConfig(
35:         audio_transcription_config=types.AudioTranscriptionConfig(
36:             word_timestamp=True,
37:             diarization=True,
38:         ),
39:     )
40: 
```
* **Line 34~39**: 전사 옵션을 담은 `GenerateContentConfig` 객체를 설정합니다.
  * `word_timestamp=True`: 각 단어가 발화된 시작/종료 시점의 타임스탬프 정보를 요청합니다.
  * `diarization=True`: 음성 내 여러 화자를 구분(화자 분리, Speaker Diarization)하도록 설정합니다.
* **Line 40**: 공백 라인입니다.

---

### 6. 스트리밍 응답 수신 및 출력

```python
41:     for chunk in client.models.generate_content_stream(
42:         model=model,
43:         contents=contents,
44:         config=generate_content_config,
45:     ):
46:         if text := chunk.text:
47:             print(text, end="")
48:     print()
49: 
50: 
```
* **Line 41~45**: `generate_content_stream()` 메서드를 호출하여 전사 결과를 실시간 스트림(Stream)으로 수신합니다.
* **Line 46~47**: 응답 청크에 텍스트가 포함되어 있을 경우, 줄바꿈 없이(`end=""`) 콘솔에 즉시 출력합니다.
* **Line 48**: 전체 스트리밍 출력이 완료된 후 줄바꿈을 출력합니다.
* **Line 49~50**: 공백 라인입니다.

---

### 7. 스크립트 실행 진입점

```python
51: if __name__ == "__main__":
52:     generate("output.wav")
```
* **Line 51~52**: 스크립트가 직접 실행되었을 때 `"output.wav"` 파일을 대상으로 전사 작업을 시작합니다.
