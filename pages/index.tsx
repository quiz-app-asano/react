// pages/index.tsx
import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, Trophy } from 'lucide-react';
import { gameManager, questions } from '../lib/gameState';

const PlayerPage: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // 状態をリアルタイムで同期
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

  // 新しい問題が開始されたときの初期化
  useEffect(() => {
    if (gameState === 'waiting') {
      setHasAnswered(false);
      setSelectedAnswer(null);
    }
  }, [gameState, questionIndex]);

  // プレイヤー登録
  const registerPlayer = () => {
    if (playerName.trim()) {
      gameManager.addPlayer(playerName.trim());
      setIsRegistered(true);
    }
  };

  // プレイヤーの回答を処理
  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered || gameState !== 'question') return;
    
    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    
    // 回答時刻を記録
    const answerTime = Date.now();
    const trimmedName = playerName.trim();
    
    // 回答を一時保存（ポイントはまだ加算しない）
    gameManager.addPendingAnswer(trimmedName, {
      answer: answerIndex,
      isCorrect: answerIndex === currentQuestion!.correct,
      timestamp: answerTime,
      points: answerIndex === currentQuestion!.correct ? currentQuestion!.points : 0
    });
  };

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-lg p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
              Yuki&Maki Wedding Party
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-lg mx-auto">
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
      </div>
    </div>
  );
};

export default PlayerPage;