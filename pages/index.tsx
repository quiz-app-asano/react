import React, { useState } from 'react';
import { Users, Trophy, Settings, Play, Square, CheckCircle, Clock, QrCode } from 'lucide-react';

const QuizApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'admin' | 'player' | 'dashboard'>('admin');
  const [gameState, setGameState] = useState<'waiting' | 'question' | 'answer' | 'results'>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [players, setPlayers] = useState<Record<string, number>>({});
  const [playerName, setPlayerName] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [questionResults, setQuestionResults] = useState<any[]>([]);
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, any>>({});

  // 結婚式用クイズ問題（サンプル）
  const questions = [
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

  // プレイヤーの回答を処理
  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered || gameState !== 'question') return;
    
    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    
    // 回答時刻を記録
    const answerTime = Date.now();
    const trimmedName = playerName.trim();
    
    // 回答を一時保存（ポイントはまだ加算しない）
    setPendingAnswers(prev => ({
      ...prev,
      [trimmedName]: {
        answer: answerIndex,
        isCorrect: answerIndex === currentQuestion.correct,
        timestamp: answerTime,
        points: answerIndex === currentQuestion.correct ? currentQuestion.points : 0
      }
    }));
  };

  // 管理画面で次の問題を出題
  const startQuestion = () => {
    if (questionIndex < questions.length) {
      setCurrentQuestion(questions[questionIndex]);
      setGameState('question');
    }
  };

  // 管理画面で正解発表
  const showAnswer = () => {
    setGameState('answer');
    
    // 正解発表時にポイントを加算し、回答結果を記録
    Object.entries(pendingAnswers).forEach(([playerName, answerData]) => {
      if (answerData.isCorrect) {
        setPlayers(prev => ({
          ...prev,
          [playerName]: (prev[playerName] || 0) + answerData.points
        }));
      }
    });
    
    // 回答結果を記録
    setQuestionResults(prev => {
      const newResults = [...prev];
      if (!newResults[questionIndex]) {
        newResults[questionIndex] = {
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          correctAnswer: currentQuestion.correct,
          answers: []
        };
      }
      
      Object.entries(pendingAnswers).forEach(([playerName, answerData]) => {
        newResults[questionIndex].answers.push({
          playerName,
          answer: answerData.answer,
          isCorrect: answerData.isCorrect,
          timestamp: answerData.timestamp,
          points: answerData.points
        });
      });
      
      // 回答時刻順でソート
      newResults[questionIndex].answers.sort((a, b) => a.timestamp - b.timestamp);
      
      return newResults;
    });
  };

  // 次の問題へ進む
  const nextQuestion = () => {
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex(prev => prev + 1);
      setGameState('waiting');
      setHasAnswered(false);
      setSelectedAnswer(null);
      setCurrentQuestion(null);
      setPendingAnswers({});
    } else {
      setGameState('results');
    }
  };

  // ゲームリセット
  const resetGame = () => {
    setGameState('waiting');
    setCurrentQuestion(null);
    setQuestionIndex(0);
    setHasAnswered(false);
    setSelectedAnswer(null);
    setPlayers({});
    setIsRegistered(false);
    setPlayerName('');
    setQuestionResults([]);
    setPendingAnswers({});
  };

  // プレイヤー登録
  const registerPlayer = () => {
    if (playerName.trim()) {
      setPlayers(prev => ({
        ...prev,
        [playerName.trim()]: prev[playerName.trim()] || 0
      }));
      setIsRegistered(true);
    }
  };

  // ランキング計算
  const getRanking = () => {
    return Object.entries(players)
      .sort(([,a], [,b]) => b - a)
      .map(([name, score], index) => ({ rank: index + 1, name, score }));
  };

  // 管理画面
  const AdminView = () => (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8" />
            管理画面
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              ダッシュボード
            </button>
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
            <h2 className="text-xl font-semibold mb-4">QRコード</h2>
            <div className="bg-white p-4 rounded-lg inline-block">
              <QrCode className="w-24 h-24 text-black mx-auto" />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              ゲストはこのQRコードから参加
            </p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">問題制御</h2>
          
          {/* ゲーム進行状況 */}
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
                {currentQuestion.options.map((option: string, index: number) => (
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

  // プレイヤー画面
  const PlayerView = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-lg mx-auto">
        {!isRegistered ? (
          // ユーザー名入力画面
          <div className="bg-white rounded-lg p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
              結婚式クイズに参加
            </h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  お名前を入力してください
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && playerName.trim()) {
                      registerPlayer();
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="あなたのお名前"
                  maxLength={20}
                />
              </div>
              <button
                onClick={registerPlayer}
                disabled={!playerName.trim()}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
              >
                参加する
              </button>
            </div>
          </div>
        ) : (
          // クイズ画面
          <div className="bg-white rounded-lg shadow-xl">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {playerName}さん
                </h2>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {players[playerName?.trim()] || 0}pt
                  </div>
                  <div className="text-sm text-gray-500">現在のスコア</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {gameState === 'waiting' && (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto flex items-center justify-center mb-4">
                      <Users className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                      ようこそ {playerName}さん！
                    </h3>
                    <p className="text-gray-600 mb-4">
                      問題が出題されるまでお待ちください
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>待機中...</span>
                    </div>
                  </div>
                </div>
              )}

              {gameState === 'question' && currentQuestion && (
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      問題 {questionIndex + 1}
                    </h3>
                    <div className="text-sm text-purple-600 font-medium">
                      {currentQuestion.points}pt
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4">
                      {currentQuestion.question}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        disabled={hasAnswered}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          selectedAnswer === index
                            ? 'border-purple-500 bg-purple-50'
                            : hasAnswered
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswer === index
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedAnswer === index && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="font-medium">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {hasAnswered && (
                    <div className="mt-4 text-center text-green-600 font-semibold">
                      回答を送信しました！
                    </div>
                  )}
                </div>
              )}

              {gameState === 'answer' && currentQuestion && (
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      正解発表
                    </h3>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4">
                      {currentQuestion.question}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option: string, index: number) => (
                      <div
                        key={index}
                        className={`w-full p-4 rounded-lg border-2 ${
                          index === currentQuestion.correct
                            ? 'border-green-500 bg-green-50'
                            : selectedAnswer === index
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            index === currentQuestion.correct
                              ? 'border-green-500 bg-green-500'
                              : selectedAnswer === index
                              ? 'border-red-500 bg-red-500'
                              : 'border-gray-300'
                          }`}>
                            {(index === currentQuestion.correct || selectedAnswer === index) && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="font-medium">{option}</span>
                          {index === currentQuestion.correct && (
                            <span className="text-green-600 font-bold ml-auto">正解!</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    {selectedAnswer === currentQuestion.correct ? (
                      <div className="text-green-600 font-bold text-lg">
                        正解！ +{currentQuestion.points}pt
                      </div>
                    ) : (
                      <div className="text-red-600 font-bold text-lg">
                        不正解...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {gameState === 'results' && (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    ゲーム終了！
                  </h3>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {players[playerName?.trim()] || 0}pt
                  </div>
                  <p className="text-gray-600">お疲れ様でした！</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ダッシュボード画面
  const DashboardView = () => {
    const ranking = getRanking();
    const latestQuestionResult = questionResults[questionResults.length - 1];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-400" />
              結婚式クイズ ランキング
            </h1>
            <button
              onClick={() => setCurrentView('admin')}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors"
            >
              管理画面に戻る
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ランキング */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                総合ランキング
              </h2>
              {ranking.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-xl text-gray-400">まだ参加者がいません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ranking.map((player, index) => (
                    <div
                      key={player.name}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index === 0
                          ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-400/50'
                          : index === 1
                          ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/50'
                          : index === 2
                          ? 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border border-orange-500/50'
                          : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            index === 0
                              ? 'bg-yellow-500 text-yellow-900'
                              : index === 1
                              ? 'bg-gray-400 text-gray-900'
                              : index === 2
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-600 text-white'
                          }`}
                        >
                          {player.rank}
                        </div>
                        <div>
                          <div className="text-lg font-semibold">
                            {player.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          {player.score}
                        </div>
                        <div className="text-sm text-gray-400">pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 直前の問題の回答順 */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-400" />
                回答順（最新問題）
              </h2>
              {!latestQuestionResult || latestQuestionResult.answers.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg text-gray-400">まだ回答がありません</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-3 bg-white/5 rounded-lg">
                    <h3 className="font-semibold text-sm text-gray-300 mb-1">問題</h3>
                    <p className="text-sm">{latestQuestionResult.question}</p>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {latestQuestionResult.answers.map((answer: any, index: number) => (
                      <div
                        key={`${answer.playerName}-${answer.timestamp}`}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          answer.isCorrect
                            ? 'bg-green-500/20 border border-green-400/30'
                            : 'bg-red-500/20 border border-red-400/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 && answer.isCorrect
                              ? 'bg-yellow-500 text-yellow-900'
                              : answer.isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{answer.playerName}</div>
                            <div className="text-xs text-gray-300">
                              {new Date(answer.timestamp).toLocaleTimeString('ja-JP', {
                                hour12: false,
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${
                            answer.isCorrect ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {answer.isCorrect ? '正解' : '不正解'}
                          </div>
                          {answer.points > 0 && (
                            <div className="text-sm text-green-300">
                              +{answer.points}pt
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {currentView === 'admin' && <AdminView />}
      {currentView === 'player' && <PlayerView />}
      {currentView === 'dashboard' && <DashboardView />}
      
      {/* ビュー切り替えボタン（開発用） */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <button
          onClick={() => setCurrentView('admin')}
          className={`px-3 py-2 rounded-lg text-sm ${
            currentView === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          管理
        </button>
        <button
          onClick={() => setCurrentView('player')}
          className={`px-3 py-2 rounded-lg text-sm ${
            currentView === 'player' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          解答
        </button>
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`px-3 py-2 rounded-lg text-sm ${
            currentView === 'dashboard' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          ランキング
        </button>
      </div>
    </div>
  );
};

export default QuizApp;