// pages/dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Users } from 'lucide-react';
import { gameManager } from '../lib/gameState';

const DashboardPage: React.FC = () => {
  // 状態をリアルタイムで同期
  const [players, setPlayers] = useState(gameManager.players);
  const [questionResults, setQuestionResults] = useState(gameManager.questionResults);

  useEffect(() => {
    const unsubscribe = gameManager.subscribe(() => {
      setPlayers(gameManager.players);
      setQuestionResults(gameManager.questionResults);
    });

    return unsubscribe;
  }, []);

  // ランキング計算
  const getRanking = () => {
    return Object.entries(players)
      .sort(([,a], [,b]) => b - a)
      .map(([name, score], index) => ({ rank: index + 1, name, score }));
  };

  const ranking = getRanking();
  const latestQuestionResult = questionResults[questionResults.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            結婚式クイズ ランキング
          </h1>
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

export default DashboardPage;