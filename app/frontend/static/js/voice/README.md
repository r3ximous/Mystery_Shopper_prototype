# Voice System Architecture

The voice recognition system has been refactored into a modular architecture for better maintainability and separation of concerns.

## Module Structure

### 🎤 `voice-core.js`
**Purpose**: Core speech recognition functionality  
**Responsibilities**:
- Web Speech API initialization and configuration
- Event handling for speech recognition lifecycle
- Start/stop recognition management
- Error handling and auto-restart logic

**Key Classes**: `VoiceCore`

### 🧠 `voice-parser.js`  
**Purpose**: Voice input parsing and interpretation  
**Responsibilities**:
- Parse spoken answers (numbers, yes/no, navigation commands)
- Handle speech recognition failsafes (tea → three, for → four)
- Map voice input to actionable commands
- Support multiple input formats (numbers, words, letters)

**Key Classes**: `VoiceParser`

### 🎨 `voice-ui.js`
**Purpose**: User interface elements and visual feedback  
**Responsibilities**:
- Voice status overlay management
- Debug transcript popup
- Question highlighting
- Answer selection visual feedback
- Voice button state management

**Key Classes**: `VoiceUI`

### 📊 `question-manager.js`
**Purpose**: Question collection, navigation, and answer selection  
**Responsibilities**:
- Collect survey questions from DOM
- Navigate between questions (next/previous)
- Map voice answers to form inputs
- Provide context-aware help messages

**Key Classes**: `QuestionManager`

### 🔊 `voice-tts.js`
**Purpose**: Text-to-speech functionality  
**Responsibilities**:
- Announce questions and guidance
- Provide voice feedback
- Control speech rate and timing

**Key Classes**: `VoiceTTS`

### 🎯 `voice-controller.js`
**Purpose**: Main orchestrator that coordinates all modules  
**Responsibilities**:
- Initialize and connect all voice modules
- Handle voice input processing workflow
- Coordinate UI updates and TTS announcements
- Manage voice mode lifecycle

**Key Classes**: `VoiceController`

## Data Flow

```
User speaks → VoiceCore (recognition) 
            → VoiceParser (interpretation) 
            → VoiceController (processing) 
            → QuestionManager (answer selection) 
            → VoiceUI (visual feedback) 
            → VoiceTTS (audio feedback)
```

## Usage

The system initializes automatically when the DOM is ready. All modules are loaded in sequence and the `VoiceController` orchestrates their interaction.

### Key Features
- **Individual question voice buttons**: Click any 🎤 button to start voice mode for that specific question
- **Full voice mode**: Use the main "Voice Mode" button for complete voice navigation
- **Debug transcript**: Toggle via the Debug button in the header for development insights
- **Failsafe parsing**: Handles common speech recognition errors automatically
- **Context-aware guidance**: Provides appropriate voice instructions based on question type

### Browser Console Access
```javascript
// Access the main controller
const controller = getVoiceController();

// Direct module access for debugging
controller.voiceParser.parseAnswer("tea"); // Returns "3"
controller.questionManager.getCurrentQuestion(); // Current question object
controller.voiceUI.addDebugLog("Test message"); // Add debug entry
```

## Benefits of Modular Architecture

1. **Maintainability**: Each module has a single responsibility
2. **Testability**: Modules can be tested independently
3. **Reusability**: Modules can be reused in other projects
4. **Debugging**: Easier to isolate issues to specific functionality
5. **Performance**: Only load required modules
6. **Team Development**: Multiple developers can work on different modules

## File Organization

```
/static/js/voice/
├── voice-core.js        # Speech recognition engine
├── voice-parser.js      # Input parsing logic  
├── voice-ui.js         # User interface components
├── question-manager.js  # Question handling
├── voice-tts.js        # Text-to-speech
└── voice-controller.js  # Main coordinator
```

Each module is self-contained and exports its classes to `window` for cross-module communication.
