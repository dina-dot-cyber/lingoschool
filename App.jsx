import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Mic, CheckCircle, Trophy, User, Shield, 
  Play, Pause, Award, Send, Volume2, RotateCcw, Image as ImageIcon, Star
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push } from 'firebase/database';

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCPJadbFzEAyndIt75H_ZZFV0LUxcBiPNY",
  authDomain: "lingoschool-b7c0e.firebaseapp.com",
  databaseURL: "https://lingoschool-b7c0e-default-rtdb.firebaseio.com",
  projectId: "lingoschool-b7c0e",
  storageBucket: "lingoschool-b7c0e.firebasestorage.app",
  messagingSenderId: "788751367290",
  appId: "1:788751367290:web:9fC320e3ebd6141e425fc3"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default function App() {
  const [role, setRole] = useState('student'); // 'student' | 'teacher'
  const [activeTab, setActiveTab] = useState('tianzige');
  const [studentName, setStudentName] = useState('Алихан');
  
  // Tianzige State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedChar, setSelectedChar] = useState({ char: '你好', pinyin: 'nǐ hǎo', tone: '1+3', meaning: 'Здравствуйте' });

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Cloud Homework state
  const [submissions, setSubmissions] = useState([]);
  const [hwComment, setHwComment] = useState('');
  const [teacherFeedback, setTeacherFeedback] = useState({});

  // Grammar test state
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  // Synchronize Submissions with Firebase
  useEffect(() => {
    const hwRef = ref(database, 'homework_submissions');
    onValue(hwRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setSubmissions(loadedList.reverse());
      } else {
        setSubmissions([]);
      }
    });
  }, []);

  // Web Speech API Pronunciation
  const speakHanzi = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Tianzige Canvas Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Микрофон недоступен: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Submit Homework to Firebase
  const submitHomework = () => {
    const canvas = canvasRef.current;
    const canvasImage = canvas ? canvas.toDataURL() : null;

    const newHwRef = push(ref(database, 'homework_submissions'));
    set(newHwRef, {
      studentName,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      character: selectedChar.char,
      comment: hwComment || 'Без комментария',
      canvasImage: canvasImage,
      hasAudio: !!audioUrl,
      status: 'На проверке',
      grade: null,
      feedback: ''
    });

    alert("Домашнее задание успешно отправлено в облачную базу Firebase!");
    setHwComment('');
    clearCanvas();
    setAudioUrl(null);
  };

  // Teacher Grade Submission
  const handleGradeSubmission = (subId, grade) => {
    const feedbackText = teacherFeedback[subId] || 'Отлично выполнено!';
    set(ref(database, `homework_submissions/${subId}/status`), 'Проверено');
    set(ref(database, `homework_submissions/${subId}/grade`), grade);
    set(ref(database, `homework_submissions/${subId}/feedback`), feedbackText);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl font-bold text-xl">Lingo</div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-900">LingoSchool LMS</h1>
            <p className="text-xs text-slate-500">Платформа изучения языков</p>
          </div>
        </div>

        {/* Role Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setRole('student')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              role === 'student' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Ученик</span>
          </button>
          <button
            onClick={() => setRole('teacher')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              role === 'teacher' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Учитель</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white rounded-2xl border border-slate-200 p-4 space-y-2 h-fit">
          <div className="text-xs font-bold text-slate-400 px-3 uppercase tracking-wider mb-2">Разделы</div>
          <button
            onClick={() => setActiveTab('tianzige')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'tianzige' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Прописи Tianzige</span>
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'grammar' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Английские Тесты</span>
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'homework' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{role === 'teacher' ? 'Проверка ДЗ' : 'Сдача ДЗ (Облако)'}</span>
          </button>
        </aside>

        {/* Dynamic Workspace Area */}
        <main className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {role === 'student' ? (
            <>
              {/* STUDENT VIEW */}
              {activeTab === 'tianzige' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Интерактивные прописи (田字格)</h2>
                    <p className="text-sm text-slate-500">Прописывайте иероглиф пальцем или мышкой и тренируйте произношение</p>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 items-center">
                    {/* Character Card */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full lg:w-64 text-center space-y-3">
                      <div className="text-6xl font-serif text-slate-900">{selectedChar.char}</div>
                      <div className="text-lg font-bold text-indigo-600">{selectedChar.pinyin}</div>
                      <div className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-1 rounded-md inline-block">
                        Тон: {selectedChar.tone}
                      </div>
                      <p className="text-sm text-slate-600">{selectedChar.meaning}</p>
                      <button
                        onClick={() => speakHanzi(selectedChar.char)}
                        className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-medium transition text-sm"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Озвучить</span>
                      </button>
                    </div>

                    {/* Tianzige Canvas */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative border-4 border-red-200 rounded-xl overflow-hidden bg-red-50/20">
                        {/* Tianzige Grid Lines */}
                        <div className="absolute inset-0 border-b-2 border-r-2 border-dashed border-red-200 pointer-events-none"></div>
                        <canvas
                          ref={canvasRef}
                          width={280}
                          height={280}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="cursor-crosshair relative z-10"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={clearCanvas}
                          className="flex items-center space-x-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Очистить холст</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'grammar' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">English Grammar Simulator</h2>
                    <p className="text-sm text-slate-500">Выберите правильную форму глагола</p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                    <p className="text-lg font-medium text-slate-800">
                      "She ________ (teach) English and Chinese at the university every day."
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['teaches', 'is teaching', 'taught', 'has taught'].map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setQuizAnswer(opt);
                            if (opt === 'teaches') setQuizScore(100);
                          }}
                          className={`p-3 rounded-xl border text-left font-medium transition ${
                            quizAnswer === opt
                              ? opt === 'teaches'
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                : 'bg-rose-50 border-rose-500 text-rose-700'
                              : 'bg-white border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {quizAnswer && (
                      <div className={`p-4 rounded-xl text-sm ${quizAnswer === 'teaches' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {quizAnswer === 'teaches'
                          ? 'Правильно! Present Simple используется для постоянных действий и расписания.'
                          : 'Не совсем. Обратите внимание на маркер "every day" (Present Simple).'
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'homework' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Сдача ДЗ в облако</h2>
                    <p className="text-sm text-slate-500">Запишите голосовое и отправьте прописи прямо преподавателю</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Ваше имя</label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="text-sm font-bold text-slate-700">1. Запись тонов (Диктофон)</div>
                      <div className="flex items-center space-x-3">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-rose-700 transition"
                          >
                            <Mic className="w-4 h-4" />
                            <span>Начать запись</span>
                          </button>
                        ) : (
                          <button
                            onClick={stopRecording}
                            className="flex items-center space-x-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-900 transition animate-pulse"
                          >
                            <Square className="w-4 h-4" />
                            <span>Остановить</span>
                          </button>
                        )}
                        {audioUrl && <span className="text-xs text-emerald-600 font-semibold">Запись готова!</span>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Комментарий к ДЗ</label>
                      <textarea
                        rows={2}
                        value={hwComment}
                        onChange={(e) => setHwComment(e.target.value)}
                        placeholder="Например: Прописала 10 раз, проверьте 3 тон..."
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      onClick={submitHomework}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>Отправить ДЗ в базу Firebase</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* TEACHER VIEW */
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Панель Учителя (Firebase Realtime)</h2>
                <p className="text-sm text-slate-500">Проверка поступивших домашних заданий в реальном времени</p>
              </div>

              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    Пока нет отправленных заданий. Нажмите «Сдать ДЗ» в режиме ученика!
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div key={sub.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900 text-base">{sub.studentName}</span>
                          <span className="text-xs text-slate-400 ml-2">{sub.date}</span>
                          <div className="text-xs text-indigo-600 font-medium">Иероглиф: {sub.character}</div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          sub.status === 'Проверено' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {sub.status}
                        </span>
                      </div>

                      {/* Canvas Drawing Preview */}
                      {sub.canvasImage && (
                        <div className="bg-white p-2 border border-slate-200 rounded-xl inline-block">
                          <div className="text-xs text-slate-400 mb-1">Пропись ученика:</div>
                          <img src={sub.canvasImage} alt="Пропись" className="w-24 h-24 border border-red-100 rounded-lg" />
                        </div>
                      )}

                      <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                        <span className="font-semibold">Заметка:</span> {sub.comment}
                      </p>

                      {/* Grade controls */}
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <input
                          type="text"
                          placeholder="Напишите комментарий преподавателя..."
                          value={teacherFeedback[sub.id] || ''}
                          onChange={(e) => setTeacherFeedback({ ...teacherFeedback, [sub.id]: e.target.value })}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                        />
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-500">Поставить оценку:</span>
                          {[5, 4, 3].map((num) => (
                            <button
                              key={num}
                              onClick={() => handleGradeSubmission(sub.id, num)}
                              className="px-3 py-1 bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-xs font-bold rounded-lg transition"
                            >
                              {num} ★
                            </button>
                          ))}
                        </div>
                        {sub.grade && (
                          <div className="text-xs text-emerald-600 font-bold">
                            Оценка: {sub.grade} ★ | Фидбек: {sub.feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
