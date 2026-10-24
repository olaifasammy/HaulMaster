# AI Dispatcher Subscription & Autonomous Dispatch Architecture

## Overview
Resolution and architectural upgrade for the Neural AI Dispatcher and Enterprise Automation suite:
1. **Precise Remaining Subscription Countdown**: Exact days, hours, minutes (`Xd Xh Xm remaining`) and exact simulation expiry date/time (`Day X HH:MM`) displayed across the AI Dispatcher, Autonomous Auto-Dispatch add-on, and Fleet Maintenance add-on.
2. **Subscription Activation & Payment Fix (Iframe Compatibility)**: Removed `window.confirm` modal calls (which browser iframe sandbox environments block, causing subscription buttons to silently abort) and added inline validation feedback.
3. **Multi-Deduction & Accidental Double-Billing Protection**: Locked checkout buttons when a subscription is active with an explicit "Extend Existing Subscription" toggle if the player intentionally wishes to purchase additional duration.
4. **Subscription Pricing & Tier Alignment**: Tier prices and durations standardizing on 7-Day Express, 1-Month Corporate (30 Days), and Monthly Auto-Renewal Enterprise tiers.
5. **Continuous Autonomous Dispatching**: Ticks automatically evaluate idle trucks at terminal hubs and match them to available regional freight contracts.

## Key Changes
- `src/components/AiDispatcherPage.tsx`: Full suite view with detailed countdown clocks, add-on checkboxes, live treasury/gold status, locked active state, extension checkbox, and manual batch dispatch.
- `src/components/AiDispatcherModal.tsx`: Fixed secondary modal without `window.confirm`, aligned tiers, countdowns, and double-deduction locks.
- `src/context/GameContext.tsx`: `activateAiSuite` & `activateAiDispatcher` multi-deduction protection (`allowExtension`), continuous auto-dispatch execution on simulation clock ticks, and unified state updates.
