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

// 簡易的な状態管理（実際のアプリではReduxやZustandを使用）
class GameStateManager {
  private static instance: GameStateManager;
  private listeners: Array<() => void> = [];
  
  public gameState: GameState = 'waiting';
  public currentQuestion: Question | null = null;
  public players: Record<string, number> = {};
  public questionIndex: number = 0;
  public questionResults: QuestionResult[] = [];
  public pendingAnswers: Record<string, any> = {};

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
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

  setGameState(state: GameState) {
    this.gameState = state;
    this.notify();
  }

  setCurrentQuestion(question: Question | null) {
    this.currentQuestion = question;
    this.notify();
  }

  addPlayer(name: string) {
    this.players[name] = this.players[name] || 0;
    this.notify();
  }

  addPendingAnswer(playerName: string, answerData: any) {
    this.pendingAnswers[playerName] = answerData;
    this.notify();
  }

  processPendingAnswers() {
    Object.entries(this.pendingAnswers).forEach(([playerName, answerData]) => {
      if (answerData.isCorrect) {
        this.players[playerName] = (this.players[playerName] || 0) + answerData.points;
      }
    });

    // 回答結果を記録
    if (!this.questionResults[this.questionIndex]) {
      this.questionResults[this.questionIndex] = {
        questionId: this.currentQuestion!.id,
        question: this.currentQuestion!.question,
        correctAnswer: this.currentQuestion!.correct,
        answers: []
      };
    }

    Object.entries(this.pendingAnswers).forEach(([playerName, answerData]) => {
      this.questionResults[this.questionIndex].answers.push({
        playerName,
        answer: answerData.answer,
        isCorrect: answerData.isCorrect,
        timestamp: answerData.timestamp,
        points: answerData.points
      });
    });

    this.questionResults[this.questionIndex].answers.sort((a, b) => a.timestamp - b.timestamp);
    this.notify();
  }

  nextQuestion() {
    if (this.questionIndex + 1 < questions.length) {
      this.questionIndex++;
      this.gameState = 'waiting';
      this.currentQuestion = null;
      this.pendingAnswers = {};
    } else {
      this.gameState = 'results';
    }
    this.notify();
  }

  resetGame() {
    this.gameState = 'waiting';
    this.currentQuestion = null;
    this.questionIndex = 0;
    this.players = {};
    this.questionResults = [];
    this.pendingAnswers = {};
    this.notify();
  }

  getRanking() {
    return Object.entries(this.players)
      .sort(([,a], [,b]) => b - a)
      .map(([name, score], index) => ({ rank: index + 1, name, score }));
  }
}

export const gameManager = GameStateManager.getInstance();