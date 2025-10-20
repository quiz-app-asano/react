// lib/gameState.js

// 結婚式用クイズ問題
export const questions = [
  {
    id: 1,
    question: "裕紀は真紀のキスを当てられる？",
    options: ["当てれる", "当てられない"],
    correct: 1,
    points: 100
  },
  {
    id: 2,
    question: "裕紀は真紀が乗った車を動かせる？",
    options: ["動かせる", "動かせない"],
    correct: 0,
    points: 200
  },
  {
    id: 3,
    question: "手・足・口を塞がれた裕紀が表現したかったことは？",
    options: ["となりのトトロ", "ベンジャミンバトン","インセプション","君の名は"],
    correct: 3,
    points: 300
  },
  {
    id: 4,
    question: "勝つのはどっち？",
    options: ["裕紀", "真紀"],
    correct: 0,
    points: 400
  }
];

// ルーレット用のアイテム
export const drinks = ['テキーラ'];
export const multipliers = ['×1', '×2', '×3'];

// Firebase設定（あなたのFirebase設定に置き換えてください）
// Your web app's Firebase configuration
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
      pendingAnswers: {},
      // ルーレット関連
      rouletteState: 'idle', // 'idle', 'spinning', 'result'
      rouletteResult: null,
      rouletteSlots: {
        name: '',
        drink: '',
        multiplier: ''
      },
      rouletteSpinning: false
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
                pendingAnswers: data.pendingAnswers || {},
                // ルーレット関連
                rouletteState: data.rouletteState || 'idle',
                rouletteResult: data.rouletteResult || null,
                rouletteSlots: data.rouletteSlots || { name: '', drink: '', multiplier: '' },
                rouletteSpinning: data.rouletteSpinning || false
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
  // ルーレット関連のゲッター
  get rouletteState() { return this.data?.rouletteState || 'idle'; }
  get rouletteResult() { return this.data?.rouletteResult || null; }
  get rouletteSlots() { return this.data?.rouletteSlots || { name: '', drink: '', multiplier: '' }; }
  get rouletteSpinning() { return this.data?.rouletteSpinning || false; }

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

  // ルーレット開始
  async startRoulette() {
    const playerNames = Object.keys(this.data.players);
    if (playerNames.length === 0) {
      console.warn('No players available for roulette');
      return;
    }

    this.data.rouletteState = 'spinning';
    this.data.rouletteSpinning = true;
    this.data.rouletteResult = null;
    this.notify();
    await this.saveToFirebase();

    // 3秒後に結果を決定
    setTimeout(async () => {
      const selectedPlayer = playerNames[Math.floor(Math.random() * playerNames.length)];
      const selectedDrink = drinks[Math.floor(Math.random() * drinks.length)];
      const selectedMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];

      this.data.rouletteState = 'result';
      this.data.rouletteSpinning = false;
      this.data.rouletteResult = {
        name: selectedPlayer,
        drink: selectedDrink,
        multiplier: selectedMultiplier,
        timestamp: Date.now()
      };
      this.data.rouletteSlots = {
        name: selectedPlayer,
        drink: selectedDrink,
        multiplier: selectedMultiplier
      };
      
      this.notify();
      await this.saveToFirebase();
    }, 3000);
  }

  // ルーレットリセット
  async resetRoulette() {
    this.data.rouletteState = 'idle';
    this.data.rouletteSpinning = false;
    this.data.rouletteResult = null;
    this.data.rouletteSlots = { name: '', drink: '', multiplier: '' };
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
      pendingAnswers: {},
      // ルーレット関連もリセット
      rouletteState: 'idle',
      rouletteResult: null,
      rouletteSlots: { name: '', drink: '', multiplier: '' },
      rouletteSpinning: false
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