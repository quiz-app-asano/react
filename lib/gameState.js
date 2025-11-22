// lib/gameState.js

// 結婚式用クイズ問題
export const questions = [
  {
    id: 1,
    question: "入籍記念日はいつ？",
    options: ["2/23（天皇誕生日）", "3/14（円周率の日）", "4/23（シジミの日）", "8/7（花の日）"],
    correct: 2,
    points: 100
  },
  {
    id: 2,
    question: "結婚式の打合せで二人が揉めたのは？",
    options: ["新婦が打合せ内容をドキュメントで管理したいと言ったら新郎が逆ギレした(最終的にはドキュメントを作成した)", "新婦が席次表を作り終わった後に、新郎が9人招待客追加を申し出た", "新郎の革靴のレンタル代が1万円かかった(新婦はメルカリで5,000円で調達した)","新郎が席札を期限までに作り終わらない","新郎が二次会の進行表を全く作らないまま「もう当日行ける！」と発言した","新郎が招待客リストのフォーマットを間違え、全然直そうとしなかったので、新婦が巻きとった","上記全て"],
    correct: 6,
    points: 100
  },
  {
    id: 3,
    question: "新郎新婦が初めて二人で遊びに行った場所は？",
    options: ["駒場東大前のカフェ", "渋谷の居酒屋","下北沢のカレー屋","吉祥寺のラーメン屋"],
    correct: 0,
    points: 100
  },
  {
    id: 4,
    question: "新婦が躍ったことのある曲の中で一番好きな曲は？",
    options: ["What is LOVE？ / モーニング娘。'14", "トライアングルドリーマー / 虹のコンキスタドール", "＝LOVE / ＝LOVE", "いぬねこ。青春真っ盛り / わーすた"],
    correct: 1,
    points: 100
  },
  {
    id: 5,
    question: "この後披露される芸のつかみは何でしょう？",
    options: ["あー！ありがとうございます〜！いま、新郎の卒業論文をいただきました！！こんなんなんぼあってもいいですからね〜", "卒業論文は、卒業式の日から書き始めます！キャー！", "ですよ。この前〜単位足りてないのに気づかず卒論発表しちゃったんですよ〜！", "トゥース！","麒麟です"],
    correct: 0,
    points: 100
  }
];

// ルーレット用のアイテム
export const drinks = ['テキーラ'];
export const multipliers = ['×1', '×2', '×3'];

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyAqBAC3KuyX1NK1AYq-hn01L80VyyL9hBE",
  authDomain: "hanamiura-2d5cb.firebaseapp.com",
  databaseURL: "https://hanamiura-2d5cb-default-rtdb.firebaseio.com",
  projectId: "hanamiura-2d5cb",
  storageBucket: "hanamiura-2d5cb.firebasestorage.app",
  messagingSenderId: "777984676466",
  appId: "1:777984676466:web:6ef77924715cc3dda5a8eb",
  measurementId: "G-RHJTFWQVP9"
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
      rouletteState: 'idle',
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
              // questionResultsが配列でない場合の対処
              let questionResults = data.questionResults || [];
              if (!Array.isArray(questionResults)) {
                console.warn('questionResults is not an array, converting:', questionResults);
                // オブジェクトの場合は配列に変換
                questionResults = Object.values(questionResults);
              }
              
              this.data = {
                gameState: data.gameState || 'waiting',
                currentQuestion: data.currentQuestion || null,
                players: data.players || {},
                questionIndex: data.questionIndex || 0,
                questionResults: questionResults,
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
    
    // 問題出題時刻を記録（必ず新しいエントリを作成）
    const questionStartTime = Date.now();
    
    console.log('=== setCurrentQuestion ===');
    console.log('Question Index:', this.data.questionIndex);
    console.log('Question:', question);
    console.log('Question Start Time:', questionStartTime, new Date(questionStartTime).toLocaleTimeString());
    
    // questionResultsの該当インデックスに必ず新規作成
    this.data.questionResults[this.data.questionIndex] = {
      questionId: question?.id || 0,
      question: question?.question || '',
      correctAnswer: question?.correct || 0,
      answers: [],
      questionStartTime: questionStartTime
    };
    
    console.log('Created question result:', this.data.questionResults[this.data.questionIndex]);
    
    this.notify();
    await this.saveToFirebase();
    
    console.log('Saved to Firebase');
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
      console.log('=== processPendingAnswers ===');
      console.log('Pending Answers:', this.data.pendingAnswers);
      console.log('Current Question Index:', this.data.questionIndex);
      console.log('Question Results:', this.data.questionResults);
      console.log('Question Results length:', this.data.questionResults.length);
      
      // ポイント加算
      Object.entries(this.data.pendingAnswers).forEach(([playerName, answerData]) => {
        if (answerData && answerData.isCorrect) {
          this.data.players[playerName] = (this.data.players[playerName] || 0) + (answerData.points || 0);
        }
      });

      // 回答結果を記録
      let currentResult = this.data.questionResults[this.data.questionIndex];
      
      // currentResultが存在しない場合は新規作成
      if (!currentResult) {
        console.warn('WARNING: currentResult not found, creating new one');
        currentResult = {
          questionId: this.data.currentQuestion?.id || 0,
          question: this.data.currentQuestion?.question || '',
          correctAnswer: this.data.currentQuestion?.correct || 0,
          answers: [],
          questionStartTime: Date.now() // フォールバック
        };
        this.data.questionResults[this.data.questionIndex] = currentResult;
      }
      
      console.log('Current Result:', currentResult);
      console.log('Current Result has questionStartTime:', currentResult.questionStartTime);
      
      // answersが配列でない場合は初期化
      if (!Array.isArray(currentResult.answers)) {
        console.warn('WARNING: answers is not an array, initializing');
        currentResult.answers = [];
      }
      
      Object.entries(this.data.pendingAnswers).forEach(([playerName, answerData]) => {
        if (answerData) {
          const answer = {
            playerName,
            answer: answerData.answer || 0,
            isCorrect: answerData.isCorrect || false,
            timestamp: answerData.timestamp || Date.now(),
            points: answerData.points || 0
          };
          
          console.log('Adding answer:', answer);
          currentResult.answers.push(answer);
        }
      });

      // 回答を時刻順にソート
      currentResult.answers.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      
      console.log('Processed answers for question', this.data.questionIndex, ':', currentResult);
      
      this.notify();
      await this.saveToFirebase();
      
      console.log('Saved to Firebase, final questionResults:', this.data.questionResults);
    } catch (error) {
      console.error('Process pending answers error:', error);
      console.error('Error stack:', error.stack);
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