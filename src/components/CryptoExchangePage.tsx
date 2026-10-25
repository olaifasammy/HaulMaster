import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Zap,
  ArrowRight,
  Briefcase,
  Lock,
  Unlock,
  Award,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

export const CryptoExchangePage: React.FC<{ onBackToProfile: () => void }> = ({ onBackToProfile }) => {
  const { state, buyCrypto, sellCrypto, stakeCrypto, unstakeCrypto, claimCryptoRewards, notifyUser } = useGame();

  const cryptoCoins = state.cryptoMarket?.coins || {};
  const holdings = state.cryptoMarket?.holdings || {};

  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [tradeAmount, setTradeAmount] = useState<string>('0.1');
  const [stakeAmount, setStakeAmount] = useState<string>('1');
  const [activeTab, setActiveTab] = useState<'trade' | 'staking' | 'portfolio' | 'analytics'>('trade');

  const selectedCoin = cryptoCoins[selectedSymbol] || {
    symbol: selectedSymbol,
    name: selectedSymbol,
    currentPriceUsd: 100,
    prevDayPriceUsd: 95,
    dayHighUsd: 105,
    dayLowUsd: 90,
    stakingApyPercent: 5.0,
    history: [],
  };

  const selectedHolding = holdings[selectedSymbol] || {
    symbol: selectedSymbol,
    amount: 0,
    averageBuyPriceUsd: 0,
    stakedAmount: 0,
    stakingRewardsClaimable: 0,
  };

  const numericTradeAmt = parseFloat(tradeAmount) || 0;
  const numericStakeAmt = parseFloat(stakeAmount) || 0;
  const totalCostUsd = numericTradeAmt * selectedCoin.currentPriceUsd;

  // Portfolio valuation
  const totalCryptoNetWorth = Object.keys(cryptoCoins).reduce((acc, sym) => {
    const coin = cryptoCoins[sym];
    const h = holdings[sym];
    const qty = (h?.amount || 0) + (h?.stakedAmount || 0);
    return acc + qty * coin.currentPriceUsd;
  }, 0);

  // Quick Max Buy calculation
  const handleMaxBuy = () => {
    if (selectedCoin.currentPriceUsd <= 0) return;
    const maxAffordable = (state.balanceUsd * 0.98) / selectedCoin.currentPriceUsd; // leave 2% buffer
    const formatted = maxAffordable >= 1 ? maxAffordable.toFixed(2) : maxAffordable.toFixed(4);
    setTradeAmount(formatted);
  };

  const handleMaxSell = () => {
    const totalOwned = selectedHolding.amount;
    setTradeAmount(totalOwned.toString());
  };

  const handleMaxStake = () => {
    setStakeAmount(selectedHolding.amount.toString());
  };

  const handleMaxUnstake = () => {
    setStakeAmount(selectedHolding.stakedAmount.toString());
  };

  const handleBuy = () => {
    if (numericTradeAmt <= 0) {
      notifyUser('Invalid Amount', 'Please enter a valid purchase quantity.', 'finance');
      return;
    }
    if (state.balanceUsd < totalCostUsd) {
      notifyUser('Insufficient Treasury', `Purchase requires $${totalCostUsd.toLocaleString()} USD. Treasury: $${Math.round(state.balanceUsd).toLocaleString()} USD. Use 'Max Buy' to purchase maximum affordable units.`, 'finance');
      return;
    }
    if (window.confirm(`Crypto Order Confirmation:\n\nBuy ${numericTradeAmt} ${selectedSymbol} for $${totalCostUsd.toLocaleString()} USD at $${selectedCoin.currentPriceUsd.toLocaleString()}/unit?\n\nExecute digital asset acquisition?`)) {
      const success = buyCrypto(selectedSymbol, numericTradeAmt);
      if (success) {
        notifyUser('Crypto Acquired', `Successfully purchased ${numericTradeAmt} ${selectedSymbol} for $${totalCostUsd.toLocaleString()} USD.`, 'finance');
      }
    }
  };

  const handleSell = () => {
    if (numericTradeAmt <= 0) return;
    const totalOwned = selectedHolding.amount;
    if (totalOwned < numericTradeAmt) {
      notifyUser('Insufficient Holdings', `You hold ${totalOwned} ${selectedSymbol}. Cannot liquidate ${numericTradeAmt}.`, 'finance');
      return;
    }
    const proceeds = numericTradeAmt * selectedCoin.currentPriceUsd;
    if (window.confirm(`Crypto Liquidation Order:\n\nSell ${numericTradeAmt} ${selectedSymbol} for +$${proceeds.toLocaleString()} USD?\n\nLiquidate into corporate treasury?`)) {
      const success = sellCrypto(selectedSymbol, numericTradeAmt);
      if (success) {
        notifyUser('Crypto Liquidated', `Successfully liquidated ${numericTradeAmt} ${selectedSymbol} for +$${proceeds.toLocaleString()} USD into company treasury.`, 'finance');
      }
    }
  };

  const handleStake = () => {
    if (numericStakeAmt <= 0) return;
    if (selectedHolding.amount < numericStakeAmt) {
      notifyUser('Insufficient Unstaked Balance', `You have ${selectedHolding.amount} ${selectedSymbol} available to stake.`, 'finance');
      return;
    }
    if (window.confirm(`Vault Staking Confirmation:\n\nLock and stake ${numericStakeAmt} ${selectedSymbol} into the Logistics Yield Vault at ${selectedCoin.stakingApyPercent}% APY?`)) {
      const success = stakeCrypto(selectedSymbol, numericStakeAmt);
      if (success) {
        notifyUser('Assets Staked', `Successfully staked ${numericStakeAmt} ${selectedSymbol} into the yield vault.`, 'finance');
      }
    }
  };

  const handleUnstake = () => {
    if (numericStakeAmt <= 0) return;
    if (selectedHolding.stakedAmount < numericStakeAmt) {
      notifyUser('Insufficient Staked Balance', `You have ${selectedHolding.stakedAmount} ${selectedSymbol} in the vault.`, 'finance');
      return;
    }
    if (window.confirm(`Vault Unstaking Confirmation:\n\nWithdraw ${numericStakeAmt} ${selectedSymbol} from the staking vault?`)) {
      const success = unstakeCrypto(selectedSymbol, numericStakeAmt);
      if (success) {
        notifyUser('Assets Unstaked', `Successfully withdrawn ${numericStakeAmt} ${selectedSymbol} from the staking vault.`, 'finance');
      }
    }
  };

  const handleClaim = () => {
    if (selectedHolding.stakingRewardsClaimable <= 0) return;
    const success = claimCryptoRewards(selectedSymbol);
    if (success) {
      notifyUser('Staking Rewards Claimed', `Successfully claimed staking dividends for ${selectedSymbol}.`, 'finance');
    }
  };

  const dayChangePct = (((selectedCoin.currentPriceUsd - selectedCoin.prevDayPriceUsd) / selectedCoin.prevDayPriceUsd) * 100).toFixed(2);
  const isPositive = Number(dayChangePct) >= 0;

  // Portfolio allocation chart data
  const portfolioChartData = Object.keys(cryptoCoins).map((sym) => {
    const coin = cryptoCoins[sym];
    const h = holdings[sym];
    const totalQty = (h?.amount || 0) + (h?.stakedAmount || 0);
    const valUsd = totalQty * coin.currentPriceUsd;
    return {
      symbol: sym,
      valuationUsd: Math.round(valUsd),
      tokens: totalQty,
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold block">
              Logistics Digital Assets & Crypto Exchange
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Enterprise Crypto Treasury, Spot Trading & Yield Vaults
            </h2>
          </div>
        </div>

        <button
          onClick={onBackToProfile}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-mono text-xs font-semibold transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Briefcase className="w-4 h-4 text-cyan-400" />
          <span>Return to Company Profile</span>
        </button>
      </div>

      {/* Portfolio Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400">Total Crypto Valuation</span>
          <div className="text-lg sm:text-xl font-mono font-bold text-cyan-400 mt-1">
            ${Math.round(totalCryptoNetWorth).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Digital Asset Reserve</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400">Treasury Liquid Cash</span>
          <div className="text-lg sm:text-xl font-mono font-bold text-emerald-400 mt-1">
            ${Math.round(state.balanceUsd).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Available USD</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400">Active Staking Vaults</span>
          <div className="text-lg sm:text-xl font-mono font-bold text-amber-400 mt-1">
            {Object.values(holdings).reduce((acc, h) => acc + h.stakedAmount, 0).toLocaleString()} Tokens
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Generating Yield APY</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400">Exchange Security</span>
          <div className="text-lg sm:text-xl font-mono font-bold text-emerald-400 mt-1">Tier-1 MultiSig</div>
          <span className="text-[10px] text-slate-500 font-mono">Cold Storage Guarded</span>
        </div>
      </div>

      {/* Coin Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.keys(cryptoCoins).map((sym) => {
          const coin = cryptoCoins[sym];
          const isSelected = selectedSymbol === sym;
          const holding = holdings[sym] || { amount: 0, stakedAmount: 0 };
          const totalHeld = (holding.amount || 0) + (holding.stakedAmount || 0);

          return (
            <button
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`p-4 rounded-xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/10 text-white'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-cyan-400">{sym}</span>
                <span className="text-[10px] text-slate-400">{coin.name}</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white">${coin.currentPriceUsd.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Holding: {totalHeld.toFixed(2)} {sym}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Trading & Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Recharts Chart & Market Stats */}
        <div className="lg:col-span-2 space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {activeTab === 'analytics' ? 'Portfolio Allocation & Valuation Analytics' : `${selectedCoin.name} (${selectedCoin.symbol}) Spot Chart`}
                </h3>
                {activeTab !== 'analytics' && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
                    isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {isPositive ? '+' : ''}{dayChangePct}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {activeTab === 'analytics' ? 'Visual distribution of corporate digital asset reserves' : 'Real-time decentralized exchange feed & liquidity pricing'}
              </p>
            </div>

            {activeTab !== 'analytics' && (
              <div className="text-right font-mono">
                <div className="text-xl font-bold text-cyan-400">${selectedCoin.currentPriceUsd.toLocaleString()} USD</div>
                <div className="text-[11px] text-slate-400">High: ${selectedCoin.dayHighUsd.toLocaleString()} | Low: ${selectedCoin.dayLowUsd.toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* Recharts Chart Area */}
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'analytics' ? (
                <BarChart data={portfolioChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="symbol" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px', fontFamily: 'monospace' }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, 'Valuation']}
                  />
                  <Bar dataKey="valuationUsd" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={selectedCoin.history || []}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="simDay" stroke="#64748b" fontSize={10} tickFormatter={(d) => `Day ${d}`} />
                  <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px', fontFamily: 'monospace' }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, 'Spot Price']}
                    labelFormatter={(lbl) => `Sim Day ${lbl}`}
                  />
                  <Area type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-t border-slate-800 pt-4 font-mono text-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('trade')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'trade' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Spot Exchange Desk
            </button>
            <button
              onClick={() => setActiveTab('staking')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'staking' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Yield Staking ({selectedCoin.stakingApyPercent}% APY)
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'portfolio' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Holdings Breakdown
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics' ? 'bg-purple-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Visual Analytics
            </button>
          </div>
        </div>

        {/* Right Col: Interactive Action Desk */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between font-mono">
          {activeTab === 'trade' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Execute {selectedSymbol} Trade</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Instant market order settlement.</p>
                </div>
                <button
                  onClick={handleMaxBuy}
                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold cursor-pointer"
                  title="Automatically allocate all available treasury cash to buy maximum affordable tokens"
                >
                  Max Buy
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Order Quantity ({selectedSymbol}):</span>
                    <button onClick={handleMaxSell} className="text-cyan-400 hover:underline text-[10px]">Max Sell</button>
                  </div>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Unit Price:</span>
                    <span className="text-white">${selectedCoin.currentPriceUsd.toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Cost / Proceeds:</span>
                    <span className="text-cyan-400 font-bold">${totalCostUsd.toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Available Treasury:</span>
                    <span className="text-emerald-400">${Math.round(state.balanceUsd).toLocaleString()} USD</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    onClick={handleBuy}
                    disabled={state.balanceUsd < totalCostUsd}
                    className="py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Buy {selectedSymbol}
                  </button>

                  <button
                    onClick={handleSell}
                    disabled={selectedHolding.amount < numericTradeAmt}
                    className="py-3 bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-500/20"
                  >
                    Sell {selectedSymbol}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staking' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Staking Yield Vault</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Earn compounding APY dividends.</p>
                </div>
                <button
                  onClick={handleMaxStake}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Max Stake
                </button>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Available to Stake:</span>
                  <span className="text-white font-bold">{selectedHolding.amount.toFixed(4)} {selectedSymbol}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Currently Staked:</span>
                  <span className="text-amber-400 font-bold">{selectedHolding.stakedAmount.toFixed(4)} {selectedSymbol}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Claimable Dividends:</span>
                  <span className="text-emerald-400 font-bold">{selectedHolding.stakingRewardsClaimable.toFixed(4)} {selectedSymbol}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Staking Quantity:</span>
                    <button onClick={handleMaxUnstake} className="text-amber-400 hover:underline text-[10px]">Max Unstake</button>
                  </div>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleStake}
                    disabled={selectedHolding.amount < numericStakeAmt}
                    className="py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Stake
                  </button>
                  <button
                    onClick={handleUnstake}
                    disabled={selectedHolding.stakedAmount < numericStakeAmt}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Unstake
                  </button>
                </div>

                <button
                  onClick={handleClaim}
                  disabled={selectedHolding.stakingRewardsClaimable <= 0}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Claim Dividends ({selectedHolding.stakingRewardsClaimable.toFixed(4)} {selectedSymbol})
                </button>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <span>Asset Holdings Breakdown</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Summary of cold storage digital assets.</p>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {Object.keys(holdings).map((sym) => {
                  const h = holdings[sym];
                  const coin = cryptoCoins[sym];
                  const total = (h.amount || 0) + (h.stakedAmount || 0);
                  const valUsd = total * coin.currentPriceUsd;

                  return (
                    <div key={sym} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-cyan-400">{sym}</span>
                        <div className="text-[10px] text-slate-400">{total.toFixed(4)} tokens (Staked: {h.stakedAmount.toFixed(4)})</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">${Math.round(valUsd).toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-400">${coin.currentPriceUsd.toLocaleString()} / ea</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex justify-between items-center font-bold">
                <span className="text-slate-400">Total Net Worth:</span>
                <span className="text-cyan-400 text-sm">${Math.round(totalCryptoNetWorth).toLocaleString()} USD</span>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Visual Portfolio Telemetry</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Advanced asset distribution metrics.</p>
              </div>

              <div className="space-y-2 text-xs">
                {Object.keys(cryptoCoins).map((sym) => {
                  const coin = cryptoCoins[sym];
                  const h = holdings[sym];
                  const total = (h?.amount || 0) + (h?.stakedAmount || 0);
                  const val = total * coin.currentPriceUsd;
                  const pct = totalCryptoNetWorth > 0 ? ((val / totalCryptoNetWorth) * 100).toFixed(1) : '0.0';

                  return (
                    <div key={sym} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-cyan-400">{sym} Allocation</span>
                        <span className="text-white">{pct}% (${Math.round(val).toLocaleString()})</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${Math.min(100, Number(pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            AMM Liquidity Pool & Yield Protocol Active
          </div>
        </div>
      </div>
    </div>
  );
};
