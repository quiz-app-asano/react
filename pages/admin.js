import { useState, useEffect } from 'react';
import { Settings, Play, CheckCircle, QrCode, Shuffle } from 'lucide-react';
import { gameManager, questions } from '../lib/gameState';

const AdminPage = () => {
  const [gameState, setGameState] = useState(gameManager.gameState);
  const [currentQuestion, setCurrentQuestion] = useState(gameManager.currentQuestion);
  const [players, setPlayers] = useState(gameManager.players);
  const [questionIndex, setQuestionIndex] = useState(gameManager.questionIndex);
  const [rouletteState, setRouletteState] = useState(gameManager.rouletteState);

  useEffect(() => {
    const unsubscribe = gameManager.subscribe(() => {
      setGameState(gameManager.gameState);
      setCurrentQuestion(gameManager.currentQuestion);
      setPlayers(gameManager.players);
      setQuestionIndex(gameManager.questionIndex);
      setRouletteState(gameManager.rouletteState);
    });

    return unsubscribe;
  }, []);

  const startQuestion = async () => {
    if (questionIndex < questions.length) {
      await gameManager.setCurrentQuestion(questions[questionIndex]);
      await gameManager.setGameState('question');
    }
  };

  const showAnswer = async () => {
    await gameManager.setGameState('answer');
    await gameManager.processPendingAnswers();
  };

  const nextQuestion = async () => {
    await gameManager.nextQuestion();
  };

  const resetGame = async () => {
    await gameManager.resetGame();
  };

  const startRoulette = async () => {
    if (Object.keys(players).length === 0) {
      alert('参加者がいません！先にクイズ参加者を集めてください。');
      return;
    }
    await gameManager.startRoulette();
  };

  const resetRoulette = async () => {
    await gameManager.resetRoulette();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8" />
            管理画面
          </h1>
          <div className="flex gap-2">
            <a
              href="/dashboard"
              target="_blank"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              ダッシュボードを開く
            </a>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              リセット
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">ゲーム状態</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>現在の状態:</span>
                <span className="capitalize font-semibold text-blue-400">
                  {gameState === 'waiting' && '待機中'}
                  {gameState === 'question' && '問題出題中'}
                  {gameState === 'answer' && '正解発表中'}
                  {gameState === 'results' && '結果発表'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>問題番号:</span>
                <span className="font-semibold">{questionIndex + 1} / {questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>参加者数:</span>
                <span className="font-semibold">{Object.keys(players).length}人</span>
              </div>
              <div className="flex justify-between">
                <span>ルーレット:</span>
                <span className="capitalize font-semibold text-purple-400">
                  {rouletteState === 'idle' && '待機中'}
                  {rouletteState === 'spinning' && '回転中'}
                  {rouletteState === 'result' && '結果表示中'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">ゲスト参加用URL</h2>
            <div className="bg-slate-700 p-4 rounded-lg mb-4">
              <code className="text-sm text-green-400 break-all">
                {typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}
              </code>
            </div>
            <div className="bg-white p-4 rounded-lg inline-block">
              <QrCode className="w-24 h-24 text-black mx-auto" />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              ゲストはこのURLにアクセス
            </p>
          </div>
        </div>

        {/* ルーレットコントロール */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎰 イベントルーレット</h2>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              参加者の中からランダムに選ばれた人が飲み物にチャレンジ！
              ダッシュボードでスロット風演出が表示されます。
            </p>
            <div className="flex gap-3">
              <button
                onClick={startRoulette}
                disabled={rouletteState === 'spinning' || Object.keys(players).length === 0}
                className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                  rouletteState !== 'spinning' && Object.keys(players).length > 0
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Shuffle className="w-5 h-5" />
                {rouletteState === 'spinning' ? '回転中...' : 'ルーレット開始'}
              </button>
              
              <button
                onClick={resetRoulette}
                disabled={rouletteState === 'idle'}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  rouletteState !== 'idle'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                ルーレットリセット
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">問題制御</h2>
          
          <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <h3 className="font-semibold mb-3">ゲーム進行状況</h3>
            <div className="flex items-center gap-4 mb-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                gameState === 'waiting' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                1. 待機中
              </div>
              <div className="w-4 h-px bg-gray-500"></div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                gameState === 'question' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                2. 問題出題中
              </div>
              <div className="w-4 h-px bg-gray-500"></div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                gameState === 'answer' ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                3. 正解発表中
              </div>
            </div>
            <div className="text-sm text-gray-400">
              現在のステップ: {gameState === 'waiting' && '次の問題の準備をしています'}
              {gameState === 'question' && 'ゲストが回答中です'}
              {gameState === 'answer' && '正解を表示中です'}
              {gameState === 'results' && '全問題が終了しました'}
            </div>
          </div>

          {currentQuestion && (
            <div className="mb-4 p-4 bg-slate-700 rounded-lg">
              <h3 className="font-semibold mb-2">現在の問題:</h3>
              <p className="mb-3">{currentQuestion.question}</p>
              <div className="grid grid-cols-2 gap-2">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      index === currentQuestion.correct
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-600 text-gray-300'
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-blue-400">
                配点: {currentQuestion.points}pt
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={startQuestion}
              disabled={gameState !== 'waiting' || questionIndex >= questions.length}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                gameState === 'waiting' && questionIndex < questions.length
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5" />
              問題出題
              {gameState === 'waiting' && questionIndex < questions.length && 
                <span className="ml-1 px-2 py-1 bg-green-700 rounded text-xs">実行可能</span>
              }
            </button>
            
            <button
              onClick={showAnswer}
              disabled={gameState !== 'question'}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                gameState === 'question'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              正解発表
              {gameState === 'question' && 
                <span className="ml-1 px-2 py-1 bg-yellow-700 rounded text-xs">実行可能</span>
              }
            </button>
            
            <button
              onClick={nextQuestion}
              disabled={gameState !== 'answer'}
              className={`px-6 py-3 rounded-lg transition-colors ${
                gameState === 'answer'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {questionIndex + 1 >= questions.length ? '結果発表' : '次の問題'}
              {gameState === 'answer' && 
                <span className="ml-1 px-2 py-1 bg-blue-700 rounded text-xs">実行可能</span>
              }
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">参加者一覧</h2>
          {Object.keys(players).length === 0 ? (
            <p className="text-gray-400">まだ参加者がいません</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(players).map(([name, score]) => (
                <div key={name} className="bg-slate-700 p-3 rounded">
                  <div className="flex justify-between">
                    <span>{name}</span>
                    <span className="font-semibold">{score}pt</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

const AdminPage = () => {
  const [gameState, setGameState] = useState(gameManager.gameState);
  const [currentQuestion, setCurrentQuestion] = useState(gameManager.currentQuestion);
  const [players, setPlayers] = useState(gameManager.players);
  const [questionIndex, setQuestionIndex] = useState(gameManager.questionIndex);

  useEffect(() => {
    const unsubscribe = gameManager.subscribe(() => {
      setGameState(gameManager.gameState);
      setCurrentQuestion(gameManager.currentQuestion);
      setPlayers(gameManager.players);
      setQuestionIndex(gameManager.questionIndex);
    });

    return unsubscribe;
  }, []);

  const startQuestion = async () => {
    if (questionIndex < questions.length) {
      await gameManager.setCurrentQuestion(questions[questionIndex]);
      await gameManager.setGameState('question');
    }
  };

  const showAnswer = async () => {
    await gameManager.setGameState('answer');
    await gameManager.processPendingAnswers();
  };

  const nextQuestion = async () => {
    await gameManager.nextQuestion();
  };

  const resetGame = async () => {
    await gameManager.resetGame();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8" />
            管理画面
          </h1>
          <div className="flex gap-2">
            <a
              href="/dashboard"
              target="_blank"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              ダッシュボードを開く
            </a>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              リセット
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">ゲーム状態</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>現在の状態:</span>
                <span className="capitalize font-semibold text-blue-400">
                  {gameState === 'waiting' && '待機中'}
                  {gameState === 'question' && '問題出題中'}
                  {gameState === 'answer' && '正解発表中'}
                  {gameState === 'results' && '結果発表'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>問題番号:</span>
                <span className="font-semibold">{questionIndex + 1} / {questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>参加者数:</span>
                <span className="font-semibold">{Object.keys(players).length}人</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">ゲスト参加用URL</h2>
            <div className="bg-slate-700 p-4 rounded-lg mb-4">
              <code className="text-sm text-green-400 break-all">
                {typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}
              </code>
            </div>
            <div className="bg-white p-4 rounded-lg inline-block">
              <QrCode className="w-24 h-24 text-black mx-auto" />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              ゲストはこのURLにアクセス
            </p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">問題制御</h2>
          
          <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <h3 className="font-semibold mb-3">ゲーム進行状況</h3>
            <div className="flex items-center gap-4 mb-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                gameState === 'waiting' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                1. 待機中
              </div>
              <div className="w-4 h-px bg-gray-500"></div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                gameState === 'question' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                2. 問題出題中
              </div>
              <div className="w-4 h-px bg-gray-500"></div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                gameState === 'answer' ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                3. 正解発表中
              </div>
            </div>
            <div className="text-sm text-gray-400">
              現在のステップ: {gameState === 'waiting' && '次の問題の準備をしています'}
              {gameState === 'question' && 'ゲストが回答中です'}
              {gameState === 'answer' && '正解を表示中です'}
              {gameState === 'results' && '全問題が終了しました'}
            </div>
          </div>

          {currentQuestion && (
            <div className="mb-4 p-4 bg-slate-700 rounded-lg">
              <h3 className="font-semibold mb-2">現在の問題:</h3>
              <p className="mb-3">{currentQuestion.question}</p>
              <div className="grid grid-cols-2 gap-2">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      index === currentQuestion.correct
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-600 text-gray-300'
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-blue-400">
                配点: {currentQuestion.points}pt
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={startQuestion}
              disabled={gameState !== 'waiting' || questionIndex >= questions.length}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                gameState === 'waiting' && questionIndex < questions.length
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5" />
              問題出題
              {gameState === 'waiting' && questionIndex < questions.length && 
                <span className="ml-1 px-2 py-1 bg-green-700 rounded text-xs">実行可能</span>
              }
            </button>
            
            <button
              onClick={showAnswer}
              disabled={gameState !== 'question'}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                gameState === 'question'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              正解発表
              {gameState === 'question' && 
                <span className="ml-1 px-2 py-1 bg-yellow-700 rounded text-xs">実行可能</span>
              }
            </button>
            
            <button
              onClick={nextQuestion}
              disabled={gameState !== 'answer'}
              className={`px-6 py-3 rounded-lg transition-colors ${
                gameState === 'answer'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {questionIndex + 1 >= questions.length ? '結果発表' : '次の問題'}
              {gameState === 'answer' && 
                <span className="ml-1 px-2 py-1 bg-blue-700 rounded text-xs">実行可能</span>
              }
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">参加者一覧</h2>
          {Object.keys(players).length === 0 ? (
            <p className="text-gray-400">まだ参加者がいません</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(players).map(([name, score]) => (
                <div key={name} className="bg-slate-700 p-3 rounded">
                  <div className="flex justify-between">
                    <span>{name}</span>
                    <span className="font-semibold">{score}pt</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;