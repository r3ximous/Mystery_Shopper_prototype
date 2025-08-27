/**
 * Voice Parser Module
 * Handles parsing of voice input with failsafe recognition patterns
 */

class VoiceParser {
    constructor() {
        this.debugCallback = null;
    }

    setDebugCallback(callback) {
        this.debugCallback = callback;
        return this;
    }

    log(message, type = 'info') {
        if (this.debugCallback) {
            this.debugCallback(message, type);
        }
    }

    parseAnswer(transcript) {
        const lower = transcript.toLowerCase();
        this.log(`Parsing answer from: "${lower}"`);

        // Check for numbers 1-9 (expanded range to support more options)
        const numberMatch = lower.match(/\b([1-9])\b/);
        if (numberMatch) {
            this.log(`Found number: ${numberMatch[1]}`);
            return numberMatch[1];
        }

        // Check for yes/no variations
        if (/\b(yes|yeah|yep|correct|true|right|affirmative)\b/i.test(lower)) {
            this.log('Found: yes');
            return 'yes';
        }

        if (/\b(no|nope|wrong|false|negative|incorrect)\b/i.test(lower)) {
            this.log('Found: no');
            return 'no';
        }

        // Check for word numbers (expanded)
        const wordNumbers = {
            'one': '1',
            'two': '2', 
            'three': '3',
            'four': '4',
            'five': '5',
            'six': '6',
            'seven': '7',
            'eight': '8',
            'nine': '9',
            'first': '1',
            'second': '2',
            'third': '3',
            'fourth': '4',
            'fifth': '5'
        };

        for (const [word, number] of Object.entries(wordNumbers)) {
            if (lower.includes(word)) {
                this.log(`Found word number: ${word} -> ${number}`);
                return number;
            }
        }

        // Failsafe parsing for common speech recognition errors
        const speechFailsafes = {
            // Common "no" misrecognitions
            'now': 'no',
            'know': 'no',
            'noah': 'no',
            'none': 'no',
            'not': 'no',

            // Common number misrecognitions
            'won': '1',
            'one': '1',
            'want': '1',
            'wine': '1',

            'to': '2',
            'too': '2',
            'two': '2',
            'tube': '2',
            'do': '2',

            'tree': '3',
            'three': '3',
            'tea': '3',
            'free': '3',
            'see': '3',

            'for': '4',
            'four': '4',
            'fore': '4',
            'door': '4',
            'more': '4',

            'five': '5',
            'hive': '5',
            'dive': '5',
            'life': '5',

            // Common "yes" misrecognitions
            'yes': 'yes',
            'yep': 'yes',
            'yeas': 'yes',
            'chess': 'yes',
            'guess': 'yes',
            'ass': 'yes', // Sometimes "yes" gets misheard

            // Additional ordinals that might be misheard
            'furst': '1',
            'fest': '1',
            'secant': '2',
            'secon': '2',
            'turd': '3',
            'therd': '3',
            'forth': '4',
            'fith': '5'
        };

        // Check each failsafe pattern
        for (const [misheard, correct] of Object.entries(speechFailsafes)) {
            if (lower.includes(misheard)) {
                // If it's a number, return the number
                if (/^\d+$/.test(correct)) {
                    this.log(`Failsafe match: "${misheard}" -> ${correct}`);
                    return correct;
                }
                // If it's yes/no, return that
                if (correct === 'yes' || correct === 'no') {
                    this.log(`Failsafe match: "${misheard}" -> ${correct}`);
                    return correct;
                }
            }
        }

        // Check for choice-related phrases
        if (lower.includes('choice') || lower.includes('option')) {
            const choiceMatch = lower.match(/(?:choice|option)\s*([1-9])/);
            if (choiceMatch) {
                this.log(`Found choice/option: ${choiceMatch[1]}`);
                return choiceMatch[1];
            }
        }

        // Check for letter choices (A, B, C, etc.) and convert to numbers
        const letterMatch = lower.match(/\b([a-i])\b/);
        if (letterMatch) {
            const letterToNumber = {
                'a': '1', 'b': '2', 'c': '3', 'd': '4', 'e': '5',
                'f': '6', 'g': '7', 'h': '8', 'i': '9'
            };
            const number = letterToNumber[letterMatch[1]];
            if (number) {
                this.log(`Found letter: ${letterMatch[1].toUpperCase()} -> ${number}`);
                return number;
            }
        }

        // Phonetic number matching (last resort)
        const phoneticNumbers = {
            'wun': '1',
            'too': '2', 
            'tree': '3',
            'for': '4',
            'fyv': '5',
            'siks': '6',
            'sevn': '7',
            'ate': '8',
            'nyn': '9'
        };

        for (const [phonetic, number] of Object.entries(phoneticNumbers)) {
            if (lower.includes(phonetic)) {
                this.log(`Phonetic match: "${phonetic}" -> ${number}`);
                return number;
            }
        }

        this.log('No recognizable answer pattern found');
        return null;
    }

    isNavigationCommand(transcript) {
        const lower = transcript.toLowerCase();
        
        if (lower.includes('next') || lower.includes('skip')) {
            return 'next';
        }
        
        if (lower.includes('previous') || lower.includes('back')) {
            return 'previous';
        }
        
        if (lower.includes('repeat') || lower.includes('again')) {
            return 'repeat';
        }
        
        if (lower.includes('stop') || lower.includes('exit')) {
            return 'stop';
        }
        
        return null;
    }
}

// Export for use by other modules
window.VoiceParser = VoiceParser;
