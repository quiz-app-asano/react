import { useState, useEffect } from 'react';
import { Trophy, Clock, Users, Shuffle } from 'lucide-react';
import { gameManager, drinks, multipliers } from '../lib/gameState';

const DashboardPage = () => {
  const [players, setPlayers] = useState({});
  const [questionResults, setQuestionResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rouletteState, setRouletteState] = useState('idle');
  const [rouletteResult, setRouletteResult] = useState(null);
  const [rouletteSlots, setRouletteSlots] = useState({ name: '', drink: '', multiplier: '' });
  const [rouletteSpinning, setRouletteSpinning] = useState(false);

  useEffect(() => {
    try {
      setPlayers(gameManager.players || {});
      setQuestionResults(gameManager.questionResults || []);
      setRouletteState(gameManager.rouletteState);
      setRouletteResult(gameManager.rouletteResult);
      setRouletteSlots(gameManager.rouletteSlots);
      setRouletteSpinning(gameManager.rouletteSpinning);
      setIsLoading(false);
    } catch (error) {
      console.error('Initial data load error:', error);
      setIsLoading(false);
    }

    const unsubscribe = gameManager.subscribe(() => {
      try {
        setPlayers(gameManager.players || {});
        setQuestionResults(gameManager.questionResults || []);
        setRouletteState(gameManager.rouletteState);
        setRouletteResult(gameManager.rouletteResult);
        setRouletteSlots(gameManager.rouletteSlots);
        setRouletteSpinning(gameManager.rouletteSpinning);
      } catch (error) {
        console.error('Data sync error:', error);
      }
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Clock className="w-16 h-16 mx-auto text-blue-400 mb-4 animate-spin" />
            <p className="text-xl">データを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  const getRanking = () => {
    try {
      if (!players || typeof players !== 'object') return [];
      
      // 各プレイヤーの合計解答時間を計算
      const playerStats = Object.keys(players).map(name => {
        let totalAnswerTime = 0;
        let answerCount = 0;
        
        // 全問題の解答時間を集計
        questionResults.forEach(result => {
          if (result && result.answers) {
            const playerAnswer = result.answers.find(a => a.playerName === name);
            if (playerAnswer && playerAnswer.timestamp && result.questionStartTime) {
              // 問題出題時刻を基準として解答時間を計算
              totalAnswerTime += (playerAnswer.timestamp - result.questionStartTime);
              answerCount++;
            }
          }
        });
        
        return {
          name,
          score: players[name] || 0,
          totalAnswerTime,
          answerCount
        };
      });
      
      // 第一にポイント順（降順）、第二に解答時間順（昇順）でソート
      return playerStats
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score; // ポイントが高い順
          }
          return a.totalAnswerTime - b.totalAnswerTime; // 解答時間が短い順
        })
        .map((player, index) => ({
          rank: index + 1,
          name: player.name,
          score: player.score,
          totalAnswerTime: player.totalAnswerTime,
          answerCount: player.answerCount
        }));
    } catch (error) {
      console.error('Ranking calculation error:', error);
      return [];
    }
  };

  const ranking = getRanking();
  
  const formatTime = (milliseconds) => {
    const totalSeconds = (milliseconds / 1000).toFixed(1);
    return `${totalSeconds}秒`;
  };

  const getRandomSlotContent = (type) => {
    if (type === 'name') {
      const playerNames = Object.keys(players);
      return playerNames.length > 0 ? playerNames[Math.floor(Math.random() * playerNames.length)] : '???';
    } else if (type === 'drink') {
      return drinks[Math.floor(Math.random() * drinks.length)];
    } else if (type === 'multiplier') {
      return multipliers[Math.floor(Math.random() * multipliers.length)];
    }
    return '???';
  };

  const SlotMachine = () => {
    const [displaySlots, setDisplaySlots] = useState({
      name: getRandomSlotContent('name'),
      drink: getRandomSlotContent('drink'),
      multiplier: getRandomSlotContent('multiplier')
    });

    useEffect(() => {
      let interval;
      if (rouletteSpinning) {
        interval = setInterval(() => {
          setDisplaySlots({
            name: getRandomSlotContent('name'),
            drink: getRandomSlotContent('drink'),
            multiplier: getRandomSlotContent('multiplier')
          });
        }, 100);
      } else if (rouletteState === 'result' && rouletteSlots) {
        setDisplaySlots(rouletteSlots);
      }

      return () => {
        if (interval) clearInterval(interval);
      };
    }, [rouletteSpinning, rouletteState, rouletteSlots]);

    const currentSlots = rouletteState === 'result' && !rouletteSpinning ? rouletteSlots : displaySlots;

    return (
      <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2 justify-center">
          <Shuffle className="w-8 h-8 text-purple-400" />
          🎰 GOKUGOKUルーレット
        </h2>
        
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="bg-white/20 rounded-lg p-6 min-w-[150px] text-center">
            <div className="text-sm text-gray-300 mb-2">参加者</div>
            <div className={`text-2xl font-bold ${rouletteSpinning ? 'animate-pulse' : ''} ${
              rouletteState === 'result' ? 'text-yellow-400' : 'text-white'
            }`}>
              {currentSlots.name || '???'}
            </div>
          </div>

          <div className="text-4xl text-white">×</div>

          <div className="bg-white/20 rounded-lg p-6 min-w-[150px] text-center">
            <div className="text-sm text-gray-300 mb-2">ドリンク</div>
            <div className={`text-2xl font-bold ${rouletteSpinning ? 'animate-pulse' : ''} ${
              rouletteState === 'result' ? 'text-green-400' : 'text-white'
            }`}>
              {currentSlots.drink || '???'}
            </div>
          </div>

          <div className="text-4xl text-white">×</div>

          <div className="bg-white/20 rounded-lg p-6 min-w-[150px] text-center">
            <div className="text-sm text-gray-300 mb-2">倍数</div>
            <div className={`text-2xl font-bold ${rouletteSpinning ? 'animate-pulse' : ''} ${
              rouletteState === 'result' ? 'text-red-400' : 'text-white'
            }`}>
              {currentSlots.multiplier || '???'}
            </div>
          </div>
        </div>

        <div className="text-center">
          {rouletteState === 'idle' && (
            <p className="text-gray-400">ルーレット待機中...</p>
          )}
          {rouletteState === 'spinning' && (
            <div className="text-yellow-400 font-bold text-xl animate-bounce">
              🎲 回転中... 🎲
            </div>
          )}
          {rouletteState === 'result' && rouletteResult && (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-yellow-400 mb-4">
                🎉 結果発表 🎉
              </div>
              <div className="text-xl text-white bg-white/20 rounded-lg p-4 inline-block">
                <strong>{rouletteResult.name}</strong>さんが
                <strong className="text-green-400 mx-2">{rouletteResult.drink}</strong>を
                <strong className="text-red-400">{rouletteResult.multiplier}</strong>
                飲むことになりました!
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            花&三浦クイズ
          </h1>
        </div>

        {rouletteState !== 'idle' && <SlotMachine />}

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur rounded-lg p-8">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 justify-center">
              <Trophy className="w-8 h-8 text-yellow-400" />
              総合ランキング
            </h2>
            {ranking.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-20 h-20 mx-auto text-gray-400 mb-6" />
                <p className="text-2xl text-gray-400 mb-2">まだ参加者がいません</p>
                <p className="text-sm text-gray-500 mt-2">
                  ゲストがクイズに参加するとここに表示されます
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ranking.map((player, index) => (
                  <div
                    key={`${player.name}-${index}`}
                    className={`flex items-center justify-between p-6 rounded-xl transition-all ${
                      rouletteResult && rouletteResult.name === player.name
                        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400 animate-pulse'
                        : index === 0
                        ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-400/50'
                        : index === 1
                        ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-2 border-gray-400/50'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-2 border-orange-500/50'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-6 flex-1">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl ${
                          rouletteResult && rouletteResult.name === player.name
                            ? 'bg-purple-500 text-white animate-bounce'
                            : index === 0
                            ? 'bg-yellow-500 text-yellow-900'
                            : index === 1
                            ? 'bg-gray-400 text-gray-900'
                            : index === 2
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-600 text-white'
                        }`}
                      >
                        {rouletteResult && rouletteResult.name === player.name ? '🎯' : player.rank}
                      </div>
                      <div className="flex-1">
                        <div className={`text-2xl font-bold mb-1 ${
                          rouletteResult && rouletteResult.name === player.name ? 'text-purple-300' : 'text-white'
                        }`}>
                          {player.name}
                          {rouletteResult && rouletteResult.name === player.name && (
                            <span className="ml-3 text-base">🍻 選ばれました!</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-gray-300">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span className="text-lg font-semibold">{player.score} pts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-lg">
                              {player.answerCount > 0 ? formatTime(player.totalAnswerTime) : '未回答'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;