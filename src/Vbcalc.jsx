import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.REACT_APP_GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


const Vbcalc = () => {
  const [spokenText, setSpokenText] = useState('');
  const [result, setResult] = useState('');
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.start();
    setIsListening(true);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setSpokenText(transcript);

      const calculated = await calculateWithGemini(transcript);

      if (calculated) {
        setResult(`Result: ${calculated}`);
        speakResult(calculated);
      } else {
        setResult("Sorry, couldn't understand.");
      }

      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setSpokenText('Error: ' + event.error);
      setIsListening(false);
    };
  };

  const speakResult = (value) => {
  if (!value) return;
  const utter = new SpeechSynthesisUtterance(`The answer is ${value}`);
  window.speechSynthesis.speak(utter);
};


  const calculateWithGemini = async (prompt) => {
  try {
    const result = await model.generateContent(
      `Please solve this math expression and return only the final answer in decimal form with exactly two digits after the decimal point: ${prompt}`
    );

    const response = await result.response;
    const text = response.text();

    console.log("Gemini raw response:", text); // For debugging

    // Extract first decimal number
    const match = text.match(/[-+]?[0-9]*\.?[0-9]+/);
    if (match) {
      const num = parseFloat(match[0]);
      return num.toFixed(2); // Format to 2 decimal places
    } else {
      return null;
    }
  } catch (err) {
    console.error('Gemini error:', err);
    return null;
  }
};



  const clearAll = () => {
    setSpokenText('');
    setResult('');
  };

  const repeatResult = () => {
    if (result && !result.startsWith('Sorry')) {
      const value = result.replace('Result: ', '');
      speakResult(value);
    }
  };

  const showHelp = () => {
    alert(
      `Voice Calculator Instructions:\n
- Click "Start Speaking" and say any math expression like:\n
  "100 plus 50", "3/4 plus 2/3", "What is 20% of 150", etc.\n
- You can include fractions, percentages, and simple math problems.\n
- Powered by Google Gemini AI for smart answers.`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white/25 backdrop-blur-lg rounded-3xl p-10 max-w-xl w-full shadow-2xl text-center"
      >
        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mb-6">
          🎙️ Voice Calculator
        </h1>

        <p className="text-white/90 mb-8 text-lg">
          Try saying something like: <span className="italic font-semibold">"3/4 plus 2/3"</span>
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={startListening}
            disabled={isListening}
            className={`px-8 py-3 rounded-full font-bold transition shadow-lg
              ${
                isListening
                  ? 'bg-yellow-400 text-yellow-900 cursor-not-allowed'
                  : 'bg-white text-indigo-700 hover:bg-indigo-100'
              }`}
          >
            {isListening ? 'Listening...' : 'Start Speaking'}
          </button>

          <button
            onClick={clearAll}
            className="px-6 py-3 rounded-full font-semibold bg-red-500 text-white hover:bg-red-600 shadow-lg transition"
          >
            Clear
          </button>

          <button
            onClick={repeatResult}
            className="px-6 py-3 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 shadow-lg transition"
          >
            Repeat Result
          </button>

          <button
            onClick={showHelp}
            className="px-6 py-3 rounded-full font-semibold bg-blue-500 text-white hover:bg-blue-600 shadow-lg transition"
          >
            Help
          </button>
        </div>

        <div className="bg-white/40 rounded-xl p-6 text-left text-indigo-900 shadow-md min-h-[120px]">
          <p className="text-sm font-medium text-indigo-800 mb-1">You said:</p>
          <p className="text-xl font-semibold">{spokenText || 'Nothing yet'}</p>

          <p className="mt-6 text-sm font-medium text-indigo-800 mb-1">Result:</p>
          <p className="text-3xl font-extrabold">{result || 'No result'}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Vbcalc;
