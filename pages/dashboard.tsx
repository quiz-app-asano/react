// lib/gameState.ts
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  points: number;
}

export interface Answer {
  playerName: string;
  answer: number;
  isCorrect: boolean;
  timestamp: number;
  points: number;
}

export interface QuestionResult {
  questionId: number;
  question: string;
  correctAnswer: number;
  answers: Answer[];
}

export type GameState = 'waiting' | 'question' | 'answer' | 'results';

export interface GameData {
  gameState: GameState;
  currentQuestion: Question | null;
  players: Record<string, number>;
  questionIndex: number;
  questionResults: QuestionResult[];
  pendingAnswers: Record<string, any>;
}

// Firebase設定（あなたのFirebase設定に置き換えてください）
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// 結婚式用クイズ問題
export const questions: Question[] = [
  {
    id: 1,
    question: "新郎の出身地はどこでしょう？",
    options: ["東京都", "大阪府", "福岡県", "北海道"],
    correct: 0,
    points: 100
  },
  {
    id: 2,
    question: "新婦の好きな食べ物は？",
    options: ["寿司", "パスタ", "カレー"],
    correct: 1,
    points: 100
  },
  {
    id: 3,
    question: "二人が初めて出会った場所は？",
    options: ["大学", "職場"],
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

// Firebase初期化（エラーハンドリング付き）
let app: any = null;
let database: any = null;

if (typeof window !== 'undefined') {
  try {
    // Firebase設定の検証
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your-api-key') {
      console.warn('Firebase config not set properly. Please update firebaseConfig in gameState.ts');
    } else {
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
      console.log('Firebase initialized successfully');
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

// Firebase を使った状態管理
class GameStateManager {
  private static instance: GameStateManager;
  private listeners: Array<() => void> = [];
  private data: GameData;
  private isConnected: boolean = false;
  
  constructor() {
    // 初期データ（安全な初期化）
    this.data = {
      gameState: 'waiting',
      currentQuestion: null,
      players: {},
      questionIndex: 0,
      questionResults: [],
      pendingAnswers: {}
    };

    // Firebaseから状態を監視（エラーハンドリング付き）
    if (database) {
      try {
        const gameRef = ref(database, 'gameState');
        onValue(gameRef, (snapshot) => {
          try {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
              // データの検証
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
        }, (error) => {
          console.error('Firebase read error:', error);
          this.isConnected = false;
        });
      } catch (error) {
        console.error('Firebase listener setup error:', error);
      }
    } else {
      console.warn('Firebase database not initialized. Running in offline mode.');
    }
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  private async saveToFirebase() {
    if (!database) {
      console.warn('Firebase not available. Changes not saved.');
      return;
    }
    
    try {
      const gameRef = ref(database, 'gameState');
      await set(gameRef, this.data);
    } catch (error) {
      console.error('Firebase save error:', error);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    try {
      this.listeners.forEach(listener => listener());
    } catch (error) {
      console.error('Listener notification error:', error);
    }
  }

  // ゲッター（安全なアクセス）
  get gameState() { return this.data?.gameState || 'waiting'; }
  get currentQuestion() { return this.data?.currentQuestion || null; }
  get players() { return this.data?.players || {}; }
  get questionIndex() { return this.data?.questionIndex || 0; }
  get questionResults() { return this.data?.questionResults || []; }
  get pendingAnswers() { return this.data?.pendingAnswers || {}; }
  get connected() { return this.isConnected; }

  async setGameState(state: GameState) {
    this.data.gameState = state;
    this.notify();
    await this.saveToFirebase();
  }

  async setCurrentQuestion(question: Question | null) {
    this.data.currentQuestion = question;
    this.notify();
    await this.saveToFirebase();
  }

  async addPlayer(name: string) {
    if (!name || typeof name !== 'string') return;
    this.data.players[name] = this.data.players[name] || 0;
    this.notify();
    await this.saveToFirebase();
  }

  async addPendingAnswer(playerName: string, answerData: any) {
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