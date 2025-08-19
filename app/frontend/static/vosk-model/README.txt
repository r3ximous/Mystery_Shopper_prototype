Place a small Vosk model here. Suggested (English small):
https://alphacephei.com/vosk/models

Example (vosk-model-small-en-us-0.15):
Unzip contents so that the directory structure looks like:

vosk-model/
  conf/
  model.conf
  ... (other model files)

Update VOSK_BASE in vosk_loader.js if you change this path.

For Arabic or bilingual, include an Arabic model and modify loader to pick based on currentLang.
