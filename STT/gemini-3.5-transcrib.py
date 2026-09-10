# To run this code you need to install the following dependencies:
# pip install google-genai

import os
from pathlib import Path
from google import genai
from google.genai import types


def generate(audio_path: str = "output.wav"):
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    audio_file = Path(audio_path)
    if not audio_file.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    audio_bytes = audio_file.read_bytes()

    model = "gemini-3.5-transcribe"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_bytes(
                    data=audio_bytes,
                    mime_type="audio/wav",
                ),
                types.Part.from_text(text="Transcribe the following audio."),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        audio_transcription_config=types.AudioTranscriptionConfig(
            word_timestamp=True,
            diarization=True,
        ),
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if text := chunk.text:
            print(text, end="")
    print()


if __name__ == "__main__":
    generate("output.wav")


