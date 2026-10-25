import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Zap,
  Briefcase,
  Lock,
  Unlock,
  Award,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet,
  Clock,
  Sparkles,
  HelpCircle,
  X,
  ExternalLink,
  Sliders,
  Calculator,
  HardDrive,
  Database,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

export const CryptoExchangePage: React.FC<{ onBackToProfile: () => void }> = ({ onBackToProfile }) => {
  const {
    state,
    buyCrypto,
    sellCrypto,
    cancelLimitOrder,
    stakeCrypto,
    unstakeCrypto,
    claimCryptoRewards,
    claimAllCryptoRewards,
    applyCryptoFuelDiscount,
    upgradeColdStorageVault,
    notifyUser,
  } = useGame();

  const cryptoCoins = state.cryptoMarket?.coins || {};
  const holdings = state.cryptoMarket?.holdings || {};
  const limitOrders = state.cryptoMarket?.limitOrders || [];
  const transactions = state.cryptoMarket?.transactions || [];
  const coldStorageLevel = state.cryptoMarket?.coldStorageLevel || 1;
  const fuelDiscountActiveUntil = state.cryptoMarket?.fuelDiscountActiveUntilSimMinutes || 0;
  const isFuelDiscountActive = fuelDiscountActiveUntil > state.simTimeMinutes;
  const remainingFuelDiscountDays = isFuelDiscountActive
    ? Math.ceil((fuelDiscountActiveUntil - state.simTimeMinutes) / 1440)
    : 0;

  // Selected coin
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [chartTimeframe, setChartTimeframe] = useState<'1D' | '7D' | '30D' | 'All'>('7D');
  const [chartMode, setChartMode] = useState<'price' | 'volume'>('price');
  const [activeDeskTab, setActiveDeskTab] = useState<'trade' | 'staking' | 'utility' | 'orders' | 'history'>('trade');

  // Trade form state
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [inputMode, setInputMode] = useState<'token' | 'usd'>('token');
  const [tradeAmount, setTradeAmount] = useState<string>('0.01');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [tradeFeedback, setTradeFeedback] = useState<{ message: string; type: 'success' | 'error'; txHash?: string } | null>(null);

  // Staking form state
  const [stakeAmount, setStakeAmount] = useState<string>('1');
  const [stakingVaultTier, setStakingVaultTier] = useState<'flexible' | '30d_locked' | '90d_sovereign'>('flexible');

  // Calculator state
  const [calcAmount, setCalcAmount] = useState<string>('100');
  const [calcDays, setCalcDays] = useState<number>(30);

  // Security upgrade modal state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  const selectedCoin = cryptoCoins[selectedSymbol] || {
    symbol: selectedSymbol,
    name: selectedSymbol,
    currentPriceUsd: 100,
    prevDayPriceUsd: 95,
    dayHighUsd: 105,
    dayLowUsd: 90,
    stakingApyPercent: 5.0,
    marketCapUsd: 10000000,
    volume24hUsd: 500000,
    circulatingSupply: '1.0M',
    description: 'Cryptographic digital utility asset.',
    utilityPerk: 'Universal digital reserve',
    network: 'Decentralized Network',
    history: [],
  };

  const selectedHolding = holdings[selectedSymbol] || {
    symbol: selectedSymbol,
    amount: 0,
    averageBuyPriceUsd: 0,
    stakedAmount: 0,
    stakingRewardsClaimable: 0,
    vaultTier: 'flexible',
    vaultLockedUntilSimMinutes: 0,
  };

  const numericLimitPrice = parseFloat(limitPrice) || selectedCoin.currentPriceUsd;
  const executionPrice = orderType === 'limit' ? numericLimitPrice : selectedCoin.currentPriceUsd;

  const rawInput = parseFloat(tradeAmount) || 0;
  const numericTradeAmt = inputMode === 'usd'
    ? (executionPrice > 0 ? rawInput / executionPrice : 0)
    : rawInput;

  const totalCostUsd = numericTradeAmt * executionPrice;

  // Fee calculation (0.1% for Tier 1, 0.05% for Tier 2, 0% for Tier 3)
  const feeRate = coldStorageLevel >= 3 ? 0 : coldStorageLevel >= 2 ? 0.0005 : 0.001;
  const estimatedFeeUsd = totalCostUsd * feeRate;
  const totalRequiredCash = totalCostUsd + estimatedFeeUsd;

  // Max affordable tokens based on current treasury
  const maxAffordableTokens = useMemo(() => {
    if (orderSide === 'buy') {
      if (executionPrice <= 0) return 0;
      const budget = Math.max(0, state.balanceUsd);
      const units = budget / (executionPrice * (1 + feeRate));
      return Math.max(0, units);
    } else {
      return selectedHolding.amount;
    }
  }, [orderSide, executionPrice, feeRate, state.balanceUsd, selectedHolding.amount]);

  // Portfolio valuation calculations
  const portfolioSummary = useMemo(() => {
    let totalValuation = 0;
    let totalCostBasis = 0;
    let totalStakedValuation = 0;
    let totalUnclaimedRewardsUsd = 0;

    Object.keys(cryptoCoins).forEach((sym) => {
      const coin = cryptoCoins[sym];
      const h = holdings[sym];
      if (!coin || !h) return;

      const totalTokens = (h.amount || 0) + (h.stakedAmount || 0);
      const val = totalTokens * coin.currentPriceUsd;
      totalValuation += val;
      totalCostBasis += totalTokens * (h.averageBuyPriceUsd || coin.currentPriceUsd);
      totalStakedValuation += (h.stakedAmount || 0) * coin.currentPriceUsd;
      totalUnclaimedRewardsUsd += (h.stakingRewardsClaimable || 0) * coin.currentPriceUsd;
    });

    const unrealizedPnL = totalValuation - totalCostBasis;
    const unrealizedPnLPct = totalCostBasis > 0 ? (unrealizedPnL / totalCostBasis) * 100 : 0;

    return {
      totalValuation,
      totalCostBasis,
      unrealizedPnL,
      unrealizedPnLPct,
      totalStakedValuation,
      totalUnclaimedRewardsUsd,
    };
  }, [cryptoCoins, holdings]);

  // Filtered chart data based on selected timeframe
  const chartData = useMemo(() => {
    const raw = selectedCoin.history || [];
    if (raw.length === 0) {
      return [{ simDay: 1, price: selectedCoin.currentPriceUsd, volumeUsd: selectedCoin.volume24hUsd || 1000000 }];
    }

    if (chartTimeframe === '1D') {
      // Synthesize intraday ticks around day price
      const base = selectedCoin.currentPriceUsd;
      return [
        { simDay: '00:00', price: Math.round(base * 0.985 * 100) / 100, volumeUsd: 120000 },
        { simDay: '04:00', price: Math.round(base * 0.992 * 100) / 100, volumeUsd: 180000 },
        { simDay: '08:00', price: Math.round(base * 1.008 * 100) / 100, volumeUsd: 340000 },
        { simDay: '12:00', price: Math.round(base * 1.015 * 100) / 100, volumeUsd: 410000 },
        { simDay: '16:00', price: Math.round(base * 1.004 * 100) / 100, volumeUsd: 290000 },
        { simDay: '20:00', price: Math.round(base * 0.998 * 100) / 100, volumeUsd: 210000 },
        { simDay: 'Now', price: base, volumeUsd: 350000 },
      ];
    }

    if (chartTimeframe === '7D') {
      return raw.slice(-7);
    }
    if (chartTimeframe === '30D') {
      return raw.slice(-30);
    }
    return raw;
  }, [selectedCoin, chartTimeframe]);

  // Order Book Simulation Data (Dynamic bids & asks)
  const orderBookData = useMemo(() => {
    const p = selectedCoin.currentPriceUsd;
    const isCryptoLowVal = p < 20;
    const step = isCryptoLowVal ? 0.05 : p * 0.0025;

    const asks = [
      { price: Math.round((p + step * 4) * 100) / 100, size: (1.5 + Math.random() * 2).toFixed(2), total: 0 },
      { price: Math.round((p + step * 3) * 100) / 100, size: (2.8 + Math.random() * 3).toFixed(2), total: 0 },
      { price: Math.round((p + step * 2) * 100) / 100, size: (4.1 + Math.random() * 4).toFixed(2), total: 0 },
      { price: Math.round((p + step * 1) * 100) / 100, size: (5.6 + Math.random() * 5).toFixed(2), total: 0 },
    ];

    const bids = [
      { price: Math.round((p - step * 1) * 100) / 100, size: (6.2 + Math.random() * 5).toFixed(2), total: 0 },
      { price: Math.round((p - step * 2) * 100) / 100, size: (4.4 + Math.random() * 4).toFixed(2), total: 0 },
      { price: Math.round((p - step * 3) * 100) / 100, size: (3.1 + Math.random() * 3).toFixed(2), total: 0 },
      { price: Math.round((p - step * 4) * 100) / 100, size: (1.9 + Math.random() * 2).toFixed(2), total: 0 },
    ];

    return { asks, bids, spread: (step * 2).toFixed(2) };
  }, [selectedCoin.currentPriceUsd]);

  // Quick Allocation Helpers
  const handleSetMaxAfford = () => {
    if (orderSide === 'buy') {
      if (maxAffordableTokens <= 0) {
        notifyUser('Insufficient Treasury', 'You do not have sufficient funds in treasury to purchase this asset.', 'finance');
        return;
      }
      if (inputMode === 'usd') {
        const maxUsd = Math.floor(state.balanceUsd / (1 + feeRate));
        setTradeAmount(maxUsd.toString());
      } else {
        const val = maxAffordableTokens >= 10 ? maxAffordableTokens.toFixed(2) : maxAffordableTokens >= 1 ? maxAffordableTokens.toFixed(4) : maxAffordableTokens.toFixed(6);
        setTradeAmount(val);
      }
    } else {
      if (selectedHolding.amount <= 0) {
        notifyUser('No Holdings', `You do not hold any ${selectedSymbol} to liquidate.`, 'finance');
        return;
      }
      if (inputMode === 'usd') {
        const maxUsd = Math.floor(selectedHolding.amount * executionPrice);
        setTradeAmount(maxUsd.toString());
      } else {
        const val = selectedHolding.amount >= 10 ? selectedHolding.amount.toFixed(2) : selectedHolding.amount.toFixed(4);
        setTradeAmount(val);
      }
    }
  };

  const handleCashPreset = (usdAmount: number) => {
    if (inputMode === 'usd') {
      setTradeAmount(usdAmount.toString());
    } else {
      if (executionPrice <= 0) return;
      const units = usdAmount / executionPrice;
      const formatted = units >= 10 ? units.toFixed(2) : units >= 1 ? units.toFixed(4) : units.toFixed(6);
      setTradeAmount(formatted);
    }
  };

  const handleQuickPercent = (pct: number) => {
    if (orderSide === 'buy') {
      if (executionPrice <= 0) return;
      const budget = state.balanceUsd * pct;
      if (inputMode === 'usd') {
        setTradeAmount(Math.floor(budget).toString());
      } else {
        const units = budget / (executionPrice * (1 + feeRate));
        const formatted = units >= 10 ? units.toFixed(2) : units >= 1 ? units.toFixed(4) : units.toFixed(6);
        setTradeAmount(formatted);
      }
    } else {
      const owned = selectedHolding.amount;
      const units = owned * pct;
      if (inputMode === 'usd') {
        setTradeAmount(Math.floor(units * executionPrice).toString());
      } else {
        const formatted = units >= 10 ? units.toFixed(2) : units >= 1 ? units.toFixed(4) : units.toFixed(6);
        setTradeAmount(formatted);
      }
    }
  };

  // Trade submission
  const handleExecuteTrade = () => {
    setTradeFeedback(null);
    if (numericTradeAmt <= 0) {
      notifyUser('Invalid Quantity', 'Please specify a positive trade volume to execute.', 'finance');
      setTradeFeedback({ message: 'Please specify a positive trade volume to execute.', type: 'error' });
      return;
    }

    if (orderSide === 'buy') {
      if (state.balanceUsd < totalRequiredCash) {
        const shortage = totalRequiredCash - state.balanceUsd;
        notifyUser('Insufficient Treasury', `Treasury balance ($${Math.round(state.balanceUsd).toLocaleString()}) cannot cover $${Math.round(totalRequiredCash).toLocaleString()} USD order.`, 'finance');
        setTradeFeedback({
          message: `Treasury shortage: You need $${Math.round(shortage).toLocaleString()} USD more. Click "Max Afford" to auto-match your balance.`,
          type: 'error',
        });
        return;
      }

      const success = buyCrypto(selectedSymbol, numericTradeAmt, orderType === 'limit', numericLimitPrice);
      if (success) {
        setTradeFeedback({
          message: `Successfully acquired ${numericTradeAmt >= 1 ? numericTradeAmt.toFixed(2) : numericTradeAmt.toFixed(4)} ${selectedSymbol} for $${Math.round(totalCostUsd).toLocaleString()} USD!`,
          type: 'success',
          txHash: '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        });
      }
    } else {
      if (selectedHolding.amount < numericTradeAmt) {
        notifyUser('Insufficient Holdings', `You only hold ${selectedHolding.amount.toFixed(4)} ${selectedSymbol}. Cannot sell ${numericTradeAmt.toFixed(4)}.`, 'finance');
        setTradeFeedback({
          message: `You hold ${selectedHolding.amount.toFixed(4)} ${selectedSymbol}. Cannot liquidate ${numericTradeAmt.toFixed(4)}.`,
          type: 'error',
        });
        return;
      }

      const success = sellCrypto(selectedSymbol, numericTradeAmt, orderType === 'limit', numericLimitPrice);
      if (success) {
        setTradeFeedback({
          message: `Successfully liquidated ${numericTradeAmt >= 1 ? numericTradeAmt.toFixed(2) : numericTradeAmt.toFixed(4)} ${selectedSymbol} for +$${Math.round(totalCostUsd).toLocaleString()} USD!`,
          type: 'success',
        });
      }
    }
  };

  // Staking submission
  const handleExecuteStaking = (action: 'stake' | 'unstake') => {
    const amt = parseFloat(stakeAmount) || 0;
    if (amt <= 0) {
      notifyUser('Invalid Quantity', 'Please enter a valid staking amount.', 'finance');
      return;
    }

    if (action === 'stake') {
      if (selectedHolding.amount < amt) {
        notifyUser('Insufficient Unstaked Balance', `Available: ${selectedHolding.amount.toFixed(4)} ${selectedSymbol}.`, 'finance');
        return;
      }
      stakeCrypto(selectedSymbol, amt, stakingVaultTier);
    } else {
      if (selectedHolding.stakedAmount < amt) {
        notifyUser('Insufficient Staked Balance', `In Vault: ${selectedHolding.stakedAmount.toFixed(4)} ${selectedSymbol}.`, 'finance');
        return;
      }
      unstakeCrypto(selectedSymbol, amt);
    }
  };

  // Harvest rewards
  const handleHarvest = (symbol: string) => {
    claimCryptoRewards(symbol);
  };

  const handleHarvestAll = () => {
    claimAllCryptoRewards();
  };

  // Activate Wholesale Fuel Perk
  const handleActivateFuelDiscount = () => {
    applyCryptoFuelDiscount(25);
  };

  // Day price change metrics
  const dayChangePct = Number((((selectedCoin.currentPriceUsd - selectedCoin.prevDayPriceUsd) / selectedCoin.prevDayPriceUsd) * 100).toFixed(2));
  const isPositive = dayChangePct >= 0;

  // Staking yield multiplier based on selected tier
  const tierYieldMultiplier = stakingVaultTier === '90d_sovereign' ? 1.55 : stakingVaultTier === '30d_locked' ? 1.25 : 1.0;
  const effectiveApy = (selectedCoin.stakingApyPercent * tierYieldMultiplier).toFixed(2);

  // Projected Return Calculator
  const projectedTokens = useMemo(() => {
    const num = parseFloat(calcAmount) || 0;
    const apy = (selectedCoin.stakingApyPercent * tierYieldMultiplier) / 100;
    const returnTokens = num * apy * (calcDays / 365);
    const returnUsd = returnTokens * selectedCoin.currentPriceUsd;
    return { returnTokens: returnTokens.toFixed(4), returnUsd: Math.round(returnUsd) };
  }, [calcAmount, calcDays, selectedCoin, tierYieldMultiplier]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/5">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
                Apex Institutional Digital Assets
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                L2 Settlement Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Enterprise Crypto Treasury & Spot Exchange Desk
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {portfolioSummary.totalUnclaimedRewardsUsd > 0 && (
            <button
              onClick={handleHarvestAll}
              className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
              title="Harvest all accrued staking yields across all token vaults"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Claim All (${Math.round(portfolioSummary.totalUnclaimedRewardsUsd).toLocaleString()})</span>
            </button>
          )}

          <button
            onClick={onBackToProfile}
            className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl font-mono text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <span>Company Profile</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Crypto Net Worth */}
        <div className="p-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Crypto Reserve</span>
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-400 tabular-nums">
            ${Math.round(portfolioSummary.totalValuation).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
            <span className={portfolioSummary.unrealizedPnL >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {portfolioSummary.unrealizedPnL >= 0 ? '+' : ''}${Math.round(portfolioSummary.unrealizedPnL).toLocaleString()} ({portfolioSummary.unrealizedPnLPct >= 0 ? '+' : ''}{portfolioSummary.unrealizedPnLPct.toFixed(1)}%)
            </span>
            <span className="text-slate-500">Unrealized PnL</span>
          </div>
        </div>

        {/* Liquid Treasury Cash */}
        <div className="p-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Treasury Fiat Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
            ${Math.round(state.balanceUsd).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            Available Trading Liquidity
          </span>
        </div>

        {/* Staked Vault Yield Assets */}
        <div className="p-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Staking Yield Vaults</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400 tabular-nums">
            ${Math.round(portfolioSummary.totalStakedValuation).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
            <span>Harvest Ready:</span>
            <span className="text-emerald-400 font-bold">${Math.round(portfolioSummary.totalUnclaimedRewardsUsd).toLocaleString()}</span>
          </div>
        </div>

        {/* Logistics Token Perks */}
        <div className="p-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">HAUL Diesel Perk</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-white flex items-center gap-1.5 mt-0.5">
            {isFuelDiscountActive ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> 15% OFF ACTIVE
              </span>
            ) : (
              <span className="text-slate-400">Standard Rates</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center justify-between">
            {isFuelDiscountActive ? (
              <span className="text-emerald-300 font-bold">{remainingFuelDiscountDays} Sim Days Left</span>
            ) : (
              <button
                onClick={handleActivateFuelDiscount}
                disabled={(holdings['HAUL']?.amount || 0) < 25}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline disabled:opacity-40 disabled:no-underline cursor-pointer"
              >
                Burn 25 HAUL (-15% Fuel)
              </button>
            )}
          </div>
        </div>

        {/* Cold Storage Security Tier */}
        <div className="p-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Vault Security</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-white mt-0.5 flex items-center gap-1.5">
            {coldStorageLevel === 3 ? (
              <span className="text-emerald-400">Tier-3 MultiSig HSM</span>
            ) : coldStorageLevel === 2 ? (
              <span className="text-cyan-400">Tier-2 Hardware HSM</span>
            ) : (
              <span className="text-amber-400">Tier-1 Hot Software</span>
            )}
          </div>
          <div className="text-[11px] font-mono mt-1 flex items-center justify-between">
            <span className="text-slate-400">Fee: {(feeRate * 100).toFixed(2)}%</span>
            {coldStorageLevel < 3 && (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                Upgrade Tier
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Asset Selector Strip */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Supported Digital Assets & Spot Markets
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Real-time automated market maker prices
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.keys(cryptoCoins).map((sym) => {
            const coin = cryptoCoins[sym];
            const isSelected = selectedSymbol === sym;
            const holding = holdings[sym] || { amount: 0, stakedAmount: 0 };
            const totalOwned = (holding.amount || 0) + (holding.stakedAmount || 0);
            const change = Number((((coin.currentPriceUsd - coin.prevDayPriceUsd) / coin.prevDayPriceUsd) * 100).toFixed(2));
            const pos = change >= 0;

            return (
              <button
                key={sym}
                onClick={() => {
                  setSelectedSymbol(sym);
                  setLimitPrice(coin.currentPriceUsd.toString());
                }}
                className={`p-3.5 rounded-2xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-cyan-400">{sym}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[70px]">{coin.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pos ? '+' : ''}{change}%
                  </span>
                </div>

                <div>
                  <div className="text-sm sm:text-base font-bold text-white tabular-nums">
                    ${coin.currentPriceUsd >= 1 ? coin.currentPriceUsd.toLocaleString() : coin.currentPriceUsd.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>Hold:</span>
                    <span className="text-slate-200 font-bold">{totalOwned.toFixed(2)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Trading & Chart Center (2-Col Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Chart, Order Book Depth & Asset Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Header & Controls */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    <span>{selectedCoin.name}</span>
                    <span className="text-cyan-400">({selectedCoin.symbol})</span>
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
                    isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {isPositive ? '+' : ''}{dayChangePct}%
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedCoin.network || 'Layer-1'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {selectedCoin.description}
                </p>
              </div>

              <div className="text-right font-mono self-start sm:self-auto">
                <div className="text-2xl font-bold text-cyan-400 tabular-nums">
                  ${selectedCoin.currentPriceUsd >= 1 ? selectedCoin.currentPriceUsd.toLocaleString() : selectedCoin.currentPriceUsd.toFixed(4)} USD
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 space-x-2">
                  <span>H: ${selectedCoin.dayHighUsd?.toLocaleString() || selectedCoin.currentPriceUsd}</span>
                  <span>L: ${selectedCoin.dayLowUsd?.toLocaleString() || selectedCoin.currentPriceUsd}</span>
                </div>
              </div>
            </div>

            {/* Timeframe & Mode Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {(['1D', '7D', '30D', 'All'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartTimeframe === tf
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs">
                <button
                  onClick={() => setChartMode('price')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    chartMode === 'price' ? 'bg-slate-700 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Price Chart
                </button>
                <button
                  onClick={() => setChartMode('volume')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    chartMode === 'volume' ? 'bg-slate-700 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Volume Bars
                </button>
              </div>
            </div>

            {/* Recharts Chart Canvas */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'volume' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="simDay"
                      stroke="#64748b"
                      fontSize={10}
                      tickFormatter={(d) => (typeof d === 'number' ? `Day ${d}` : d)}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px', fontFamily: 'monospace' }}
                      formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, '24h Volume']}
                    />
                    <Bar dataKey="volumeUsd" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="cryptoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? '#06b6d4' : '#f43f5e'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={isPositive ? '#06b6d4' : '#f43f5e'} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="simDay"
                      stroke="#64748b"
                      fontSize={10}
                      tickFormatter={(d) => (typeof d === 'number' ? `Day ${d}` : d)}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => `$${v >= 1000 ? v.toLocaleString() : v}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px', fontFamily: 'monospace' }}
                      formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, 'Spot Price']}
                      labelFormatter={(lbl) => (typeof lbl === 'number' ? `Simulation Day ${lbl}` : lbl)}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? '#06b6d4' : '#f43f5e'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#cryptoGradient)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Asset Telemetry Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase">24h Volume</span>
                <span className="font-bold text-white mt-0.5 block">
                  ${selectedCoin.volume24hUsd ? (selectedCoin.volume24hUsd / 1000000).toFixed(1) + 'M USD' : 'N/A'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase">Market Cap</span>
                <span className="font-bold text-white mt-0.5 block">
                  ${selectedCoin.marketCapUsd ? (selectedCoin.marketCapUsd / 1000000).toFixed(1) + 'M USD' : 'N/A'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase">Supply</span>
                <span className="font-bold text-cyan-400 mt-0.5 block">{selectedCoin.circulatingSupply || 'Uncapped'}</span>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase">Staking APY</span>
                <span className="font-bold text-amber-400 mt-0.5 block">Up to {selectedCoin.stakingApyPercent}%</span>
              </div>
            </div>
          </div>

          {/* Simulated Order Book & Recent Depth */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Real-Time Order Book & Market Depth</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated Market Maker liquidity pool depth</p>
              </div>
              <div className="text-right text-[11px]">
                <span className="text-slate-400">Spread: </span>
                <span className="text-amber-400 font-bold">${orderBookData.spread} USD</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Asks (Sell Orders) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold px-1">
                  <span>Price (USD)</span>
                  <span>Size ({selectedSymbol})</span>
                </div>
                {orderBookData.asks.map((ask, idx) => (
                  <div key={idx} className="flex justify-between p-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-400 relative overflow-hidden">
                    <span className="font-bold">${ask.price.toLocaleString()}</span>
                    <span>{ask.size}</span>
                  </div>
                ))}
              </div>

              {/* Bids (Buy Orders) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold px-1">
                  <span>Price (USD)</span>
                  <span>Size ({selectedSymbol})</span>
                </div>
                {orderBookData.bids.map((bid, idx) => (
                  <div key={idx} className="flex justify-between p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 relative overflow-hidden">
                    <span className="font-bold">${bid.price.toLocaleString()}</span>
                    <span>{bid.size}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Interactive Action Terminal (Trading Desk / Staking / Utility / Orders) */}
        <div className="space-y-6">
          {/* Sub-Navigation Tabs */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2 shadow-xl flex items-center gap-1 font-mono text-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveDeskTab('trade')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                activeDeskTab === 'trade'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Spot & Limit
            </button>
            <button
              onClick={() => setActiveDeskTab('staking')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                activeDeskTab === 'staking'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vault Yield
            </button>
            <button
              onClick={() => setActiveDeskTab('utility')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                activeDeskTab === 'utility'
                  ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fleet Utility
            </button>
            <button
              onClick={() => setActiveDeskTab('orders')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-center relative ${
                activeDeskTab === 'orders'
                  ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Orders ({limitOrders.filter((o) => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveDeskTab('history')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                activeDeskTab === 'history'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ledger
            </button>
          </div>

          {/* TAB 1: Spot & Limit Trading Desk */}
          {activeDeskTab === 'trade' && (
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4 font-mono">
              {/* Order Mode (Market vs Limit) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setOrderType('market')}
                  className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    orderType === 'market' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Market (Instant)
                </button>
                <button
                  onClick={() => {
                    setOrderType('limit');
                    if (!limitPrice) setLimitPrice(selectedCoin.currentPriceUsd.toString());
                  }}
                  className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    orderType === 'limit' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Limit Order
                </button>
              </div>

              {/* Order Side (Buy vs Sell) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setOrderSide('buy')}
                  className={`py-2.5 rounded-xl font-bold transition-all cursor-pointer border ${
                    orderSide === 'buy'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Buy {selectedSymbol}
                </button>
                <button
                  onClick={() => setOrderSide('sell')}
                  className={`py-2.5 rounded-xl font-bold transition-all cursor-pointer border ${
                    orderSide === 'sell'
                      ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-md shadow-rose-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Sell {selectedSymbol}
                </button>
              </div>

              {/* Limit Price Input if orderType === limit */}
              {orderType === 'limit' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Limit Trigger Price (USD):</span>
                    <button
                      onClick={() => setLimitPrice(selectedCoin.currentPriceUsd.toString())}
                      className="text-cyan-400 hover:underline text-[10px] cursor-pointer"
                    >
                      Use Spot (${selectedCoin.currentPriceUsd.toLocaleString()})
                    </button>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                    placeholder="Enter limit price..."
                  />
                </div>
              )}

              {/* Denomination Mode Toggle */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Order Denomination:</span>
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => {
                      if (inputMode !== 'token') {
                        setInputMode('token');
                        const amt = numericTradeAmt > 0 ? (numericTradeAmt >= 1 ? numericTradeAmt.toFixed(2) : numericTradeAmt.toFixed(4)) : '0.01';
                        setTradeAmount(amt);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      inputMode === 'token' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Units ({selectedSymbol})
                  </button>
                  <button
                    onClick={() => {
                      if (inputMode !== 'usd') {
                        setInputMode('usd');
                        const usdVal = totalCostUsd > 0 ? Math.round(totalCostUsd).toString() : '100';
                        setTradeAmount(usdVal);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      inputMode === 'usd' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    USD ($)
                  </button>
                </div>
              </div>

              {/* Quantity / Amount Input */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>
                    {inputMode === 'usd' ? 'Purchase Budget ($ USD):' : `Order Volume (${selectedSymbol}):`}
                  </span>
                  <span className="text-slate-300">
                    {orderSide === 'buy'
                      ? `Treasury: $${Math.round(state.balanceUsd).toLocaleString()}`
                      : `Hold: ${selectedHolding.amount.toFixed(4)} ${selectedSymbol}`}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full pl-3 pr-20 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                    placeholder={inputMode === 'usd' ? '100.00' : '0.00'}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-slate-400 pointer-events-none">
                    {inputMode === 'usd' ? 'USD' : selectedSymbol}
                  </div>
                </div>

                {/* Conversion estimate sub-label */}
                <div className="flex justify-between text-[11px] text-slate-400 px-1 pt-0.5">
                  <span>
                    {inputMode === 'usd'
                      ? `≈ ${numericTradeAmt >= 1 ? numericTradeAmt.toFixed(4) : numericTradeAmt.toFixed(6)} ${selectedSymbol}`
                      : `≈ $${Math.round(totalCostUsd).toLocaleString()} USD`}
                  </span>
                  <button
                    onClick={handleSetMaxAfford}
                    className="text-cyan-400 hover:underline cursor-pointer font-bold"
                  >
                    {orderSide === 'buy' ? 'Max Afford' : 'Sell All'}
                  </button>
                </div>
              </div>

              {/* Quick Cash & Percentage Presets */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold">
                  <span>Quick Cash Presets:</span>
                  <span>Fractional:</span>
                </div>
                <div className="grid grid-cols-6 gap-1 text-[11px] font-mono">
                  <button
                    onClick={() => handleCashPreset(50)}
                    className="py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    $50
                  </button>
                  <button
                    onClick={() => handleCashPreset(250)}
                    className="py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    $250
                  </button>
                  <button
                    onClick={() => handleCashPreset(1000)}
                    className="py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    $1k
                  </button>
                  <button
                    onClick={() => handleQuickPercent(0.25)}
                    className="py-1 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    25%
                  </button>
                  <button
                    onClick={() => handleQuickPercent(0.50)}
                    className="py-1 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    onClick={handleSetMaxAfford}
                    className="py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Live Insufficient Treasury Warning if Applicable */}
              {orderSide === 'buy' && state.balanceUsd < totalRequiredCash && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-rose-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Insufficient Treasury Balance
                    </span>
                    <span>Short by ${Math.round(totalRequiredCash - state.balanceUsd).toLocaleString()} USD</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                    <span>Treasury: ${Math.round(state.balanceUsd).toLocaleString()} USD</span>
                    <button
                      onClick={handleSetMaxAfford}
                      className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded font-bold cursor-pointer"
                    >
                      Set to Max Afford ({maxAffordableTokens >= 1 ? maxAffordableTokens.toFixed(2) : maxAffordableTokens.toFixed(4)} {selectedSymbol})
                    </button>
                  </div>
                </div>
              )}

              {/* Trade Feedback Alert Banner */}
              {tradeFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                    tradeFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {tradeFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">{tradeFeedback.message}</p>
                    {tradeFeedback.txHash && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Tx Hash: {tradeFeedback.txHash}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setTradeFeedback(null)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Financial Breakdown Card */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Execution Price:</span>
                  <span className="text-white">${executionPrice.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Gross Cost:</span>
                  <span className="text-cyan-400 font-bold">${Math.round(totalCostUsd).toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Exchange Fee ({feeRate === 0 ? '0% MultiSig' : `${(feeRate * 100).toFixed(2)}%`}):</span>
                  <span className="text-slate-300">${estimatedFeeUsd.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Total Escrow Required:</span>
                  <span className={`font-bold ${state.balanceUsd >= totalRequiredCash ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${Math.round(totalRequiredCash).toLocaleString()} USD
                  </span>
                </div>
              </div>

              {/* Smart Submit Execution Button */}
              <button
                onClick={handleExecuteTrade}
                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                  orderSide === 'buy'
                    ? state.balanceUsd < totalRequiredCash
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-amber-500/10'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                    : selectedHolding.amount < numericTradeAmt
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      : 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/25'
                }`}
              >
                {orderSide === 'buy' ? (
                  state.balanceUsd < totalRequiredCash ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Insufficient Funds (Treasury: ${Math.round(state.balanceUsd).toLocaleString()})</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      <span>Execute Buy {numericTradeAmt > 0 ? `${numericTradeAmt >= 1 ? numericTradeAmt.toFixed(2) : numericTradeAmt.toFixed(4)} ${selectedSymbol}` : selectedSymbol}</span>
                    </>
                  )
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    <span>Liquidate {numericTradeAmt > 0 ? `${numericTradeAmt >= 1 ? numericTradeAmt.toFixed(2) : numericTradeAmt.toFixed(4)} ${selectedSymbol}` : selectedSymbol}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: Yield Staking Vaults */}
          {activeDeskTab === 'staking' && (
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>{selectedSymbol} Staking Yield Vault</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Automated compounding logistics APY</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                  {effectiveApy}% APY
                </span>
              </div>

              {/* Vault Tier Selection */}
              <div className="space-y-1.5">
                <span className="text-slate-400 font-bold">Choose Staking Vault Tier:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setStakingVaultTier('flexible')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      stakingVaultTier === 'flexible'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">Flexible</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">0-Day Lock</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">1.0x APY</div>
                  </button>

                  <button
                    onClick={() => setStakingVaultTier('30d_locked')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      stakingVaultTier === '30d_locked'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">30-Day Term</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">30-Day Lock</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">+25% APY</div>
                  </button>

                  <button
                    onClick={() => setStakingVaultTier('90d_sovereign')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      stakingVaultTier === '90d_sovereign'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">90-Day Sovereign</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">90-Day Lock</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">+55% APY</div>
                  </button>
                </div>
              </div>

              {/* Balances Card */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
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

              {/* Stake Amount Input */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Quantity to Stake / Unstake:</span>
                  <div className="space-x-2">
                    <button
                      onClick={() => setStakeAmount(selectedHolding.amount.toString())}
                      className="text-amber-400 hover:underline text-[10px] cursor-pointer"
                    >
                      Max Stake
                    </button>
                    <button
                      onClick={() => setStakeAmount(selectedHolding.stakedAmount.toString())}
                      className="text-slate-400 hover:underline text-[10px] cursor-pointer"
                    >
                      Max Unstake
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="any"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExecuteStaking('stake')}
                  disabled={selectedHolding.amount <= 0}
                  className="py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Deposit & Stake
                </button>
                <button
                  onClick={() => handleExecuteStaking('unstake')}
                  disabled={selectedHolding.stakedAmount <= 0}
                  className="py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Withdraw Tokens
                </button>
              </div>

              {/* Claim Dividend Harvest Button */}
              <button
                onClick={() => handleHarvest(selectedSymbol)}
                disabled={selectedHolding.stakingRewardsClaimable <= 0}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20"
              >
                Harvest Dividends ({selectedHolding.stakingRewardsClaimable.toFixed(4)} {selectedSymbol})
              </button>

              {/* Compound Calculator Drawer */}
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 mt-2">
                <div className="flex items-center justify-between text-slate-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-cyan-400" /> Projected Yield Calculator
                  </span>
                  <span className="text-emerald-400 font-bold">+{projectedTokens.returnTokens} {selectedSymbol}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    placeholder="Principal tokens"
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs"
                  />
                  <select
                    value={calcDays}
                    onChange={(e) => setCalcDays(Number(e.target.value))}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs cursor-pointer"
                  >
                    <option value={7}>7 Simulation Days</option>
                    <option value={30}>30 Simulation Days</option>
                    <option value={90}>90 Simulation Days</option>
                    <option value={365}>365 Simulation Days</option>
                  </select>
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  Projected Value: <span className="text-white font-bold">${projectedTokens.returnUsd.toLocaleString()} USD</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Fleet Utility Perks (Enterprise DeFi) */}
          {activeDeskTab === 'utility' && (
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-xs">
              <div>
                <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Logistics Fleet Token Utilities</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Real operational utility powering your logistics network</p>
              </div>

              {/* Utility Card 1: Fuel Wholesale Perk */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Wholesale Diesel Rebate (-15%)</div>
                      <div className="text-[10px] text-slate-400">Burn 25 HAUL for 7 Sim Days</div>
                    </div>
                  </div>
                  {isFuelDiscountActive ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                      {remainingFuelDiscountDays}d ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">INACTIVE</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Applies an immediate 15% wholesale rebate on all terminal diesel bunkering across all North American and European hubs.
                </p>
                <button
                  onClick={handleActivateFuelDiscount}
                  disabled={(holdings['HAUL']?.amount || 0) < 25}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg transition-all cursor-pointer"
                >
                  Burn 25 HAUL (You hold: {(holdings['HAUL']?.amount || 0).toFixed(2)})
                </button>
              </div>

              {/* Utility Card 2: IoT Telemetry Satellite Uplink */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">IoT Cold-Chain Telemetry</div>
                      <div className="text-[10px] text-slate-400">Requires 100+ LGT Tokens</div>
                    </div>
                  </div>
                  {(holdings['LGT']?.amount || 0) >= 100 ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">LOCKED</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Grants real-time refrigerated cargo sensor auditing, avoiding temperature abuse citations on high-paying cold chain freights.
                </p>
                <div className="text-[10px] text-slate-500">
                  Current holding: <span className="text-white font-bold">{(holdings['LGT']?.amount || 0).toFixed(2)} LGT</span>
                </div>
              </div>

              {/* Utility Card 3: MultiSig Cold Storage Vault */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Hardware HSM Cold Storage</div>
                      <div className="text-[10px] text-slate-400">Tier {coldStorageLevel} Protected</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Upgrade Vault
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Reduces exchange trading fees down to 0% and boosts all staking APY yields by +25%.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Active Limit Orders */}
          {activeDeskTab === 'orders' && (
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>Open Limit Orders ({limitOrders.filter((o) => o.status === 'pending').length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Automated execution when price threshold hits</p>
                </div>
              </div>

              {limitOrders.filter((o) => o.status === 'pending').length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                  No active limit orders in book. Place a limit order on the trading desk.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {limitOrders
                    .filter((o) => o.status === 'pending')
                    .map((order) => (
                      <div key={order.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.side === 'buy' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {order.side.toUpperCase()}
                            </span>
                            <span className="font-bold text-white">{order.amount} {order.symbol}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Target: <span className="text-white">${order.targetPriceUsd.toLocaleString()}</span> | Total: ${Math.round(order.totalUsd).toLocaleString()}
                          </div>
                        </div>

                        <button
                          onClick={() => cancelLimitOrder(order.id)}
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Transaction Ledger & Audit */}
          {activeDeskTab === 'history' && (
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>Digital Asset Transaction Audit Log</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Immutable record of corporate crypto operations</p>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                  No transactions recorded yet. Execute spot trades, staking, or utilities to view ledger history.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {transactions.slice(0, 15).map((tx) => (
                    <div key={tx.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'buy'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : tx.type === 'sell'
                              ? 'bg-rose-500/20 text-rose-300'
                              : tx.type === 'stake'
                              ? 'bg-amber-500/20 text-amber-300'
                              : tx.type === 'claim_reward'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {tx.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="font-bold text-white">{tx.amount.toFixed(4)} {tx.symbol}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{tx.simTimeFormatted}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span>Valuation: ${Math.round(tx.totalUsd).toLocaleString()} USD</span>
                        <span className="text-slate-500 text-[10px] font-mono">{tx.txHash ? tx.txHash.slice(0, 10) + '...' : ''}</span>
                      </div>
                      {tx.note && (
                        <div className="text-[10px] text-slate-500 italic">{tx.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Security Upgrade Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl font-mono space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Upgrade Cold Storage Vault</h3>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="text-slate-400">Current Security Tier:</div>
                <div className="text-white font-bold text-sm">
                  {coldStorageLevel === 1 ? 'Tier 1: Hot Software Wallet' : 'Tier 2: Hardware Ledger HSM'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Trading Fee: {(feeRate * 100).toFixed(2)}% | Staking Yield Multiplier: 1.0x
                </div>
              </div>

              <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-1">
                <div className="text-cyan-400 font-bold">
                  Next Tier: {coldStorageLevel === 1 ? 'Tier 2: Hardware Ledger HSM' : 'Tier 3: Institutional MultiSig Vault'}
                </div>
                <div className="text-white font-bold text-sm">
                  Upgrade Cost: ${coldStorageLevel === 1 ? '15,000' : '50,000'} USD
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 pt-1 list-disc list-inside">
                  <li>Exchange Trading Fees reduced to {coldStorageLevel === 1 ? '0.05%' : '0.00%'}</li>
                  <li>Staking Vault yields boosted by +{coldStorageLevel === 1 ? '10%' : '25%'}</li>
                  <li>Immune to catastrophic exchange counterparty loss</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  upgradeColdStorageVault();
                  setIsUpgradeModalOpen(false);
                }}
                disabled={state.balanceUsd < (coldStorageLevel === 1 ? 15000 : 50000)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                Confirm Upgrade (${coldStorageLevel === 1 ? '15,000' : '50,000'})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
