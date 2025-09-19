// lib/gameState.js

// 結婚式用クイズ問題
export const questions = [
  {
    id: 1,
    question: "浅野はまきのキスを当てれる？",
    options: ["当てれる", "当てれない"],
    correct: 0,
    points: 100
  },
  {
    id: 2,
    question: "浅野が乳首だけで書いた文字は？",
    options: ["まきあいしてる", "いしいこうだい", "慶應ファイ！"],
    correct: 1,
    points: 100
  },
  {
    id: 3,
    question: "二人が初めて出会った場所は？",
    options: ["相席屋", "合コン"],
    correct: 1,
    points: 150
  },
  {
    id: 4,
    question: "新郎のプロポーズの言葉は？",
    options: ["結婚してください", "一緒にいてください", "僕と一生一緒にいてくれませんか", "君と家族になりたい"],
    correct: 2,
    points: 200
  }
];

// Firebase設定（あなたのFirebase設定に置き換えてください）
const firebaseConfig = {
  apiKey: "AIzaSyDxPn0RI4lPdGBJvVLITNP5-Qe8GalQeak",
  authDomain: "asano-quiz.firebaseapp.com",
  databaseURL: "https://asano-quiz-default-rtdb.firebaseio.com",
  projectId: "asano-quiz",
  storageBucket: "asano-quiz.firebasestorage.app",
  messagingSenderId: "56741317827",
  appId: "1:56741317827:web:4a6669d3557e398f892676"
};

// Firebase初期化（動的インポート）
let app = null;
let database = null;

const initializeFirebase = async () => {
  if (typeof window !== 'undefined' && !app) {
    try {
      const { initializeApp } = await import('firebase/app');
      const { getDatabase, ref, set, onValue } = await import('firebase/database');
      
      // 設定チェック
      if (firebaseConfig.apiKey === "your-api-key") {
        console.warn('Firebase config not set properly. Running in demo mode.');
        return null;
      }
      
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
      console.log('Firebase initialized successfully');
      return { ref, set, onValue };
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return null;
    }
  }
  return null;
};

// 状態管理クラス
class GameStateManager {
  constructor() {
    this.listeners = [];
    this.isConnected = false;
    this.firebaseTools = null;
    
    this.data = {
      gameState: 'waiting',
      currentQuestion: null,
      players: {},
      questionIndex: 0,
      questionResults: [],
      pendingAnswers: {}
    };

    // Firebase初期化を非同期で実行
    this.initFirebase();
  }

  async initFirebase() {
    this.firebaseTools = await initializeFirebase();
    if (this.firebaseTools && database) {
      try {
        const gameRef = this.firebaseTools.ref(database, 'gameState');
        this.firebaseTools.onValue(gameRef, (snapshot) => {
          try {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
              this.data = {
                gameState: data.gameState || 'waiting',
                currentQuestion: data.currentQuestion || null,
                players: data.players || {},
                questionIndex: data.questionIndex || 0,
                questionResults: data.questionResults || [],
                pendingAnswers: data.pendingAnswers || {}
              };
              this.isConnected = true;
              this.notify();
            }
          } catch (error) {
            console.error('Data parsing error:', error);
          }
        });
      } catch (error) {
        console.error('Firebase listener setup error:', error);
      }
    }
  }

  static getInstance() {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  async saveToFirebase() {
    if (!this.firebaseTools || !database) {
      console.warn('Firebase not available. Changes not saved.');
      return;
    }
    
    try {
      const gameRef = this.firebaseTools.ref(database, 'gameState');
      await this.firebaseTools.set(gameRef, this.data);
    } catch (error) {
      console.error('Firebase save error:', error);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    try {
      this.listeners.forEach(listener => listener());
    } catch (error) {
      console.error('Listener notification error:', error);
    }
  }

  // ゲッター
  get gameState() { return this.data?.gameState || 'waiting'; }
  get currentQuestion() { return this.data?.currentQuestion || null; }
  get players() { return this.data?.players || {}; }
  get questionIndex() { return this.data?.questionIndex || 0; }
  get questionResults() { return this.data?.questionResults || []; }
  get pendingAnswers() { return this.data?.pendingAnswers || {}; }
  get connected() { return this.isConnected; }

  async setGameState(state) {
    this.data.gameState = state;
    this.notify();
    await this.saveToFirebase();
  }

  async setCurrentQuestion(question) {
    this.data.currentQuestion = question;
    this.notify();
    await this.saveToFirebase();
  }

  async addPlayer(name) {
    if (!name || typeof name !== 'string') return;
    this.data.players[name] = this.data.players[name] || 0;
    this.notify();
    await this.saveToFirebase();
  }

  async addPendingAnswer(playerName, answerData) {
    if (!playerName || !answerData) return;
    this.data.pendingAnswers[playerName] = answerData;
    this.notify();
    await this.saveToFirebase();
  }

  async processPendingAnswers() {
    try {
      // ポイント加算
      Object.entries(this.data.pendingAnswers).forEach(([playerName, answerData]) => {
        if (answerData && answerData.isCorrect) {
          this.data.players[playerName] = (this.data.players[playerName] || 0) + (answerData.points || 0);
        }
      });

      // 回答結果を記録
      if (!this.data.questionResults[this.data.questionIndex]) {
        this.data.questionResults[this.data.questionIndex] = {
          questionId: this.data.currentQuestion?.id || 0,
          question: this.data.currentQuestion?.question || '',
          correctAnswer: this.data.currentQuestion?.correct || 0,
          answers: []
        };
      }

      Object.entries(this.data.pendingAnswers).forEach(([playerName, answerData]) => {
        if (answerData) {
          this.data.questionResults[this.data.questionIndex].answers.push({
            playerName,
            answer: answerData.answer || 0,
            isCorrect: answerData.isCorrect || false,
            timestamp: answerData.timestamp || Date.now(),
            points: answerData.points || 0
          });
        }
      });

      this.data.questionResults[this.data.questionIndex].answers.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      this.notify();
      await this.saveToFirebase();
    } catch (error) {
      console.error('Process pending answers error:', error);
    }
  }

  async nextQuestion() {
    if (this.data.questionIndex + 1 < questions.length) {
      this.data.questionIndex++;
      this.data.gameState = 'waiting';
      this.data.currentQuestion = null;
      this.data.pendingAnswers = {};
    } else {
      this.data.gameState = 'results';
    }
    this.notify();
    await this.saveToFirebase();
  }

  async resetGame() {
    this.data = {
      gameState: 'waiting',
      currentQuestion: null,
      questionIndex: 0,
      players: {},
      questionResults: [],
      pendingAnswers: {}
    };
    this.notify();
    await this.saveToFirebase();
  }

  getRanking() {
    try {
      return Object.entries(this.data.players || {})
        .filter(([name, score]) => name && typeof score === 'number')
        .sort(([,a], [,b]) => (b || 0) - (a || 0))
        .map(([name, score], index) => ({ 
          rank: index + 1, 
          name, 
          score: score || 0 
        }));
    } catch (error) {
      console.error('Ranking calculation error:', error);
      return [];
    }
  }
}

export const gameManager = GameStateManager.getInstance();