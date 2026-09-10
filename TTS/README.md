# TTS (Text-to-Speech): `gemini-3.1-flash-tts-preview.py` 라인 바이 라인 가이드

이 문서는 Google GenAI SDK(`google-genai`)를 활용하여 텍스트 및 상황/감정 지시어를 기반으로 음성을 합성하고, 반환된 PCM 오디오 데이터를 표준 WAV 파일(`output.wav`)로 변환 및 저장하는 `gemini-3.1-flash-tts-preview.py` 소스코드를 한 줄씩 상세하게 설명합니다.

---

## 📌 주요 기능
- **상황 및 감정 기반 음성 합성**: Scene, Context, 감정 태그(`[excited]`, `[pause]`, `[confident]` 등)를 반영한 풍부한 발화 생성
- **오디오 모달리티 직접 출력**: `response_modalities=["audio"]`를 통한 원본 오디오 스트림 수신
- **표준 WAV 변환**: 수신된 Raw L16 PCM 데이터에 `struct.pack`으로 44바이트 RIFF/WAVE 헤더를 직접 부착하여 파일로 저장

---

## 🔍 라인 바이 라인 코드 해설

### 1. 의존성 및 모듈 임포트

```python
1: # To run this code you need to install the following dependencies:
2: # pip install google-genai
3: 
```
* **Line 1~2**: `google-genai` 라이브러리 설치 안내 주석입니다.
* **Line 3**: 공백 라인입니다.

```python
4: import mimetypes
5: import os
6: import re
7: import struct
8: from google import genai
9: from google.genai import types
10: 
11: 
```
* **Line 4~6**: 표준 라이브러리 임포트 (`mimetypes`, `os`, `re`).
* **Line 7 (`import struct`)**: C 구조체 패킹을 사용하여 리틀 엔디언 규격의 바이너리 WAV 헤더를 생성하기 위해 임포트합니다.
* **Line 8~9**: Google GenAI SDK 클라이언트(`genai`)와 타입 클래스(`types`)를 임포트합니다.
* **Line 10~11**: 함수 정의 전 공백 라인입니다.

---

### 2. 바이너리 파일 저장 헬퍼 함수

```python
12: def save_binary_file(file_name, data):
13:     f = open(file_name, "wb")
14:     f.write(data)
15:     f.close()
16:     print(f"File saved to to: {file_name}")
17: 
18: 
```
* **Line 12**: `save_binary_file(file_name, data)` 함수를 정의합니다.
* **Line 13~15**: 바이너리 쓰기 모드(`"wb"`)로 파일을 열어 바이트 데이터를 기록한 후 안전하게 닫습니다.
* **Line 16**: 저장이 완료된 파일 경로를 콘솔에 출력합니다.
* **Line 17~18**: 공백 라인입니다.

---

### 3. 클라이언트 초기화 및 프롬프트 구성

```python
19: def generate():
20:     client = genai.Client(
21:         api_key=os.environ.get("GEMINI_API_KEY"),
22:     )
23: 
```
* **Line 19~22**: 메인 생성 함수 `generate()`를 정의하고 환경변수 `GEMINI_API_KEY`를 이용해 API 클라이언트를 초기화합니다.
* **Line 23**: 공백 라인입니다.

```python
24:     model = "gemini-3.1-flash-tts-preview"
25:     contents = [
26:         types.Content(
27:             role="user",
28:             parts=[
29:                 types.Part.from_text(text="""## Scene:
30: An excited tech keynote stage with subtle crowd murmur in the background
31: 
32: ## Sample Context:
33: The host is about to unveil the highly anticipated iPhone 18 after teasing new breakthrough features.
34: 
35: ## Transcript:
36: [excited] 드디어 기다리시던 순간이 왔습니다! [pause] 애플이 새로운 차세대 플래그십, [clear] '아이폰 18'을 전격 공개했습니다. [confident] 이번 모델은 완전히 새로워진 온디바이스 AI 성능과 함께, 전례 없는 배터리 효율을 자랑합니다. [amused] 정말 믿기 힘들 만큼 놀랍지 않나요?"""),
37:             ],
38:         ),
39:     ]
```
* **Line 24**: 음성 합성 전용 모델인 `gemini-3.1-flash-tts-preview`를 지정합니다.
* **Line 25~39**: 모델에 전달할 프롬프트 구조입니다.
  * `## Scene:`: 배경 분위기(예: 테크 키노트 무대, 청중 소음 등)를 지시합니다.
  * `## Sample Context:`: 화자의 역할 및 발표 상황 맥락을 제공합니다.
  * `## Transcript:`: 감정/어조 태그(`[excited]`, `[pause]`, `[clear]`, `[confident]`, `[amused]`)를 포함하여 합성할 대사를 작성합니다.

---

### 4. TTS 설정 (오디오 모달리티 및 보이스 선택)

```python
40:     generate_content_config = types.GenerateContentConfig(
41:         temperature=1,
42:         response_modalities=[
43:             "audio",
44:         ],
45:         speech_config=types.SpeechConfig(
46:             voice_config=types.VoiceConfig(
47:                 prebuilt_voice_config=types.PrebuiltVoiceConfig(
48:                     voice_name="Zephyr"
49:                 )
50:             )
51:         ),
52:     )
53: 
```
* **Line 40~52**: TTS 생성을 위한 설정을 구성합니다.
  * `temperature=1`: 음성의 자연스러운 억양과 감정 변화를 유도합니다.
  * `response_modalities=["audio"]`: 모델이 텍스트가 아닌 **오디오 바이너리**를 직접 반환하도록 지정합니다.
  * `speech_config`: 프리빌트 음성 중 `"Zephyr"` 보이스를 선택합니다.
* **Line 53**: 공백 라인입니다.

---

### 5. 스트리밍 오디오 수신 및 청크 수집

```python
54:     audio_chunks = []
55:     mime_type = "audio/L16;rate=24000"
56: 
57:     for chunk in client.models.generate_content_stream(
58:         model=model,
59:         contents=contents,
60:         config=generate_content_config,
61:     ):
62:         if (
63:             chunk.parts is None
64:         ):
65:             continue
66:         if chunk.parts[0].inline_data and chunk.parts[0].inline_data.data:
67:             inline_data = chunk.parts[0].inline_data
68:             mime_type = inline_data.mime_type
69:             audio_chunks.append(inline_data.data)
70:         else:
71:             if text := chunk.text:
72:                 print(text)
73: 
```
* **Line 54**: 수신되는 바이너리 오디오 조각들을 모을 리스트를 초기화합니다.
* **Line 55**: 기본 MIME 타입(16비트 리니어 PCM, 24kHz 샘플레이트)을 정의합니다.
* **Line 57~61**: 스트리밍 API를 호출하여 청크 단위로 응답을 수신합니다.
* **Line 62~65**: 유효한 파트가 없는 청크는 건너뜁니다.
* **Line 66~69**: `inline_data`에 오디오 바이너리가 포함된 경우, MIME 타입을 갱신하고 바이트 데이터를 `audio_chunks` 리스트에 누적합니다.
* **Line 70~72**: 오디오 외에 텍스트 응답이 포함되어 있다면 콘솔에 출력합니다.
* **Line 73**: 공백 라인입니다.

---

### 6. 오디오 병합, WAV 변환 및 파일 저장

```python
74:     if audio_chunks:
75:         raw_audio = b"".join(audio_chunks)
76:         wav_data = convert_to_wav(raw_audio, mime_type)
77:         output_file = "output.wav"
78:         save_binary_file(output_file, wav_data)
79: 
```
* **Line 74~75**: 수신된 모든 오디오 청크들을 `b"".join()`을 통해 하나의 바이너리 바이트 시퀀스로 병합합니다.
* **Line 76**: `convert_to_wav()`를 호출하여 헤더가 없는 Raw PCM 데이터 앞에 유효한 WAV 헤더를 결합합니다.
* **Line 77~78**: 최종 완성된 WAV 바이트 데이터를 `"output.wav"` 파일로 저장합니다.
* **Line 79**: 공백 라인입니다.

---

### 7. WAV 헤더 생성 함수 (`convert_to_wav`)

```python
80: def convert_to_wav(audio_data: bytes, mime_type: str) -> bytes:
81:     """Generates a WAV file header for the given audio data and parameters.
...
89:     """
90:     parameters = parse_audio_mime_type(mime_type)
91:     bits_per_sample = parameters["bits_per_sample"]
92:     sample_rate = parameters["rate"]
93:     num_channels = 1
94:     data_size = len(audio_data)
95:     bytes_per_sample = bits_per_sample // 8
96:     block_align = num_channels * bytes_per_sample
97:     byte_rate = sample_rate * block_align
98:     chunk_size = 36 + data_size  # 36 bytes for header fields before data chunk size
```
* **Line 80~89**: 함수 선언 및 독스트링입니다.
* **Line 90~92**: `parse_audio_mime_type()`을 통해 비트 수(16)와 샘플레이트(24000)를 추출합니다.
* **Line 93**: 모노 오디오이므로 `num_channels = 1`을 설정합니다.
* **Line 94~98**: 표준 WAV 헤더 작성을 위한 필드값을 계산합니다:
  * `data_size`: Raw 오디오 바이트 길이
  * `bytes_per_sample`: 16 // 8 = 2바이트
  * `block_align`: 채널 × 바이트 수 = 2
  * `byte_rate`: 24000 × 2 = 48000 (초당 전송 바이트)
  * `chunk_size`: 전체 파일 크기 - 8바이트 (36 + data_size)

```python
100:     # http://soundfile.sapp.org/doc/WaveFormat/
101: 
102:     header = struct.pack(
103:         "<4sI4s4sIHHIIHH4sI",
104:         b"RIFF",          # ChunkID
105:         chunk_size,       # ChunkSize (total file size - 8 bytes)
106:         b"WAVE",          # Format
107:         b"fmt ",          # Subchunk1ID
108:         16,               # Subchunk1Size (16 for PCM)
109:         1,                # AudioFormat (1 for PCM)
110:         num_channels,     # NumChannels
111:         sample_rate,      # SampleRate
112:         byte_rate,        # ByteRate
113:         block_align,      # BlockAlign
114:         bits_per_sample,  # BitsPerSample
115:         b"data",          # Subchunk2ID
116:         data_size         # Subchunk2Size (size of audio data)
117:     )
118:     return header + audio_data
```
* **Line 102~117**: `struct.pack()`을 사용해 리틀 엔디언(`<`) 44바이트 RIFF/WAVE 표준 헤더 바이너리를 생성합니다.
* **Line 118**: 44바이트 헤더와 원본 PCM 오디오 데이터를 연결(`+`)하여 최종 WAV 바이너리를 반환합니다.

---

### 8. MIME 타입 파싱 함수 (`parse_audio_mime_type`)

```python
120: def parse_audio_mime_type(mime_type: str) -> dict[str, int | None]:
...
131:     """
132:     bits_per_sample = 16
133:     rate = 24000
134: 
135:     # Extract rate from parameters
136:     parts = mime_type.split(";")
137:     for param in parts: # Skip the main type part
138:         param = param.strip()
139:         if param.lower().startswith("rate="):
140:             try:
141:                 rate_str = param.split("=", 1)[1]
142:                 rate = int(rate_str)
143:             except (ValueError, IndexError):
144:                 pass # Keep rate as default
145:         elif param.startswith("audio/L"):
146:             try:
147:                 bits_per_sample = int(param.split("L", 1)[1])
148:             except (ValueError, IndexError):
149:                 pass # Keep bits_per_sample as default if conversion fails
150: 
151:     return {"bits_per_sample": bits_per_sample, "rate": rate}
```
* **Line 120~134**: MIME 타입 문자열(예: `"audio/L16;rate=24000"`)을 분석하여 샘플 레이트와 비트 깊이를 추출합니다.
* **Line 136~144**: `rate=` 매개변수를 찾아 정수형 샘플레이트로 변환합니다.
* **Line 145~149**: `audio/L` 뒤의 숫자(예: `16`)를 추출하여 비트 수로 변환합니다.
* **Line 151**: 추출된 값을 딕셔너리로 반환합니다.

---

### 9. 스크립트 실행 진입점

```python
155: if __name__ == "__main__":
156:     generate()
```
* **Line 155~156**: 스크립트가 직접 실행되면 `generate()` 함수를 호출하여 음성 합성 및 파일 저장을 수행합니다.
