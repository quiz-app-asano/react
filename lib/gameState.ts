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
  apiKey: "AIzaSyDxPn0RI4lPdGBJvVLITNP5-Qe8GalQeak",
  authDomain: "asano-quiz.firebaseapp.com",
  projectId: "asano-quiz",
  storageBucket: "asano-quiz.firebasestorage.app",
  messagingSenderId: "56741317827",
  appId: "1:56741317827:web:4a6669d3557e398f892676"
};

// クイズ問題
export const questions: Question[] = [
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
    question: "浅野のプロポーズの言葉は？",
    options: ["結婚してください", "一緒にいてください", "僕と一生一緒にいてくれませんか", "君と家族になりたい"],
    correct: 2,
    points: 200
  }
];


// Firebase初期化
let app: any;
let database: any;

if (typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
}

// Firebase を使った状態管理
class GameStateManager {
  private static instance: GameStateManager;
  private listeners: Array<() => void> = [];
  private data: GameData;
  
  constructor() {
    // 初期データ
    this.data = {
      gameState: 'waiting',
      currentQuestion: null,
      players: {},
      questionIndex: 0,
      questionResults: [],
      pendingAnswers: {}
    };

    // Firebaseから状態を監視
    if (database) {
      const gameRef = ref(database, 'gameState');
      onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.data = data;
          this.notify();
        }
      });
    }
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  private async saveToFirebase() {
    if (!database) return;
    
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
    this.listeners.forEach(listener => listener());
  }

  // ゲッター
  get gameState() { return this.data.gameState; }
  get currentQuestion() { return this.data.currentQuestion; }
  get players() { return this.data.players; }
  get questionIndex() { return this.data.questionIndex; }
  get questionResults() { return this.data.questionResults; }
  get pendingAnswers() { return this.data.pendingAnswers; }

  async setGameState(state: GameState) {
    this.data.gameState = state;
    await this.saveToFirebase();
  }

  async setCurrentQuestion(question: Question | null) {
    this.data.currentQuestion = question;
    await this.saveToFirebase();
  }

  async addPlayer(name: string) {
    this.data.players[name] = this.data.players[name] || 0;
    await this.saveToFirebase();
  }

  async addPendingAnswer(playerName: string, answerData: any) {
    this.data.pendingAnswers[playerName] = answerData;
    await this.saveToFirebase();
  }

  async processPendingAnswers() {
    // ポイント加算
    Object.entries(this.data.pendingAnswers).forEach(([playerName, answerData]) => {
      if (answerData.isCorrect) {
        this.data.players[playerName] = (this.data.players[playerName] || 0) + answerData.points;
      }
    });

    // 回答結果を記録
    if (!this.data.questionResults[this.data.questionIndex]) {
      this.data.questionResults[this.data.questionIndex] = {
        questionId: this.data.currentQuestion!.id,
        question: this.data.currentQuestion!.question,
        correctAnswer: this.data.currentQuestion!.correct,
        answers: []
      };
    }

    Object.entries(this.data.pendingAnswers).forEach(([playerName, answerData]) => {
      this.data.questionResults[this.data.questionIndex].answers.push({
        playerName,
        answer: answerData.answer,
        isCorrect: answerData.isCorrect,
        timestamp: answerData.timestamp,
        points: answerData.points
      });
    });

    this.data.questionResults[this.data.questionIndex].answers.sort((a, b) => a.timestamp - b.timestamp);
    await this.saveToFirebase();
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
    await this.saveToFirebase();
  }

  getRanking() {
    return Object.entries(this.data.players)
      .sort(([,a], [,b]) => b - a)
      .map(([name, score], index) => ({ rank: index + 1, name, score }));
  }
}

export const gameManager = GameStateManager.getInstance();