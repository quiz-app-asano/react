// lib/gameState.ts
export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  points: number;
}

export interface Player {
  name: string;
  score: number;
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
  lastUpdated: number;
}

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
    question: "新郎のプロポーズの言葉は？",
    options: ["結婚してください", "一緒にいてください", "僕と一生一緒にいてくれませんか", "君と家族になりたい"],
    correct: 2,
    points: 200
  }
];


const STORAGE_KEY = 'wedding-quiz-game-state';

// LocalStorageを使った状態管理
class GameStateManager {
  private static instance: GameStateManager;
  private listeners: Array<() => void> = [];
  private data: GameData;
  
  constructor() {
    // 初期データ
    const defaultData: GameData = {
      gameState: 'waiting',
      currentQuestion: null,
      players: {},
      questionIndex: 0,
      questionResults: [],
      pendingAnswers: {},
      lastUpdated: Date.now()
    };

    // LocalStorageから読み込み、なければ初期データ
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.data = stored ? JSON.parse(stored) : defaultData;
    } else {
      this.data = defaultData;
    }

    // 定期的にLocalStorageをチェックして同期
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.syncFromStorage();
      }, 1000); // 1秒ごと
    }
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  private syncFromStorage() {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const storedData: GameData = JSON.parse(stored);
      // 最後の更新時刻をチェックして、新しいデータのみ同期
      if (storedData.lastUpdated > this.data.lastUpdated) {
        this.data = storedData;
        this.notify();
      }
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    this.data.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
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

  setGameState(state: GameState) {
    this.data.gameState = state;
    this.saveToStorage();
    this.notify();
  }

  setCurrentQuestion(question: Question | null) {
    this.data.currentQuestion = question;
    this.saveToStorage();
    this.notify();
  }

  addPlayer(name: string) {
    this.data.players[name] = this.data.players[name] || 0;
    this.saveToStorage();
    this.notify();
  }

  addPendingAnswer(playerName: string, answerData: any) {
    this.data.pendingAnswers[playerName] = answerData;
    this.saveToStorage();
    this.notify();
  }

  processPendingAnswers() {
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
    this.saveToStorage();
    this.notify();
  }

  nextQuestion() {
    if (this.data.questionIndex + 1 < questions.length) {
      this.data.questionIndex++;
      this.data.gameState = 'waiting';
      this.data.currentQuestion = null;
      this.data.pendingAnswers = {};
    } else {
      this.data.gameState = 'results';
    }
    this.saveToStorage();
    this.notify();
  }

  resetGame() {
    this.data = {
      gameState: 'waiting',
      currentQuestion: null,
      questionIndex: 0,
      players: {},
      questionResults: [],
      pendingAnswers: {},
      lastUpdated: Date.now()
    };
    this.saveToStorage();
    this.notify();
  }

  getRanking() {
    return Object.entries(this.data.players)
      .sort(([,a], [,b]) => b - a)
      .map(([name, score], index) => ({ rank: index + 1, name, score }));
  }
}

export const gameManager = GameStateManager.getInstance();