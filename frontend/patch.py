import re

with open(r"c:\Users\Anushka Agarwal\Downloads\TRIKMED.WEB-main\TRIKMED.WEB-main\frontend\src\components\rx\VoiceButton.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove SpeechRecognition init block
content = re.sub(
    r"// ── 1\. Browser SpeechRecognition.*?(?=// ── 2\. MediaRecorder)",
    "",
    content,
    flags=re.DOTALL
)

# 2. Remove stop block
content = re.sub(
    r"// Stop recognition\s+if \(recognitionRef\.current\) \{.*?\recognitionRef\.current = null\s+\}",
    "",
    content,
    flags=re.DOTALL
)

# 3. Modify "Live transcript" text in the UI to remove references to the live text stream
content = content.replace("Live transcript", "Recording Status")
content = content.replace("Start speaking. (speak in English or Hindi)", "Listening to microphone... (speak in English or Hindi)")
content = content.replace("const liveTranscript = (accumulatedRef.current || liveText || '').trim()", "const liveTranscript = ''")

with open(r"c:\Users\Anushka Agarwal\Downloads\TRIKMED.WEB-main\TRIKMED.WEB-main\frontend\src\components\rx\VoiceButton.jsx", "w", encoding="utf-8") as f:
    f.write(content)
