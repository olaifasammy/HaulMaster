import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { GlobalLogisticsMap } from './components/GlobalLogisticsMap';
import { LiveOperations } from './components/LiveOperations';
import { FleetManager } from './components/FleetManager';
import { FreightMarket } from './components/FreightMarket';
import { DriverRoster } from './components/DriverRoster';
import { HubsManager } from './components/HubsManager';
import { FinancialLedger } from './components/FinancialLedger';
import { TruckInspectorModal } from './components/TruckInspectorModal';
import { RouteDispatcherModal } from './components/RouteDispatcherModal';
import {
  Activity,
  Truck,
  Package,
  Users,
  MapPin,
  DollarSign,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { state, resetGame } = useGame();
  const [currentTab, setCurrentTab] = useState<string>('operations');
  const [inspectedTruckId, setInspectedTruckId] = useState<string | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [preselectedContractId, setPreselectedContractId] = useState<string | undefined>(undefined);

  const handleOpenDispatch = (contractId?: string) => {
    setPreselectedContractId(contractId);
    setIsDispatchModalOpen(true);
  };

  const mobileNavItems = [
    { id: 'operations', label: 'Ops', icon: Activity },
    { id: 'fleet', label: 'Fleet', icon: Truck },
    { id: 'market', label: 'Market', icon: Package },
    { id: 'drivers', label: 'Crew', icon: Users },
    { id: 'hubs', label: 'Hubs', icon: MapPin },
    { id: 'ledger', label: 'P&L', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden w-full">
      {/* Universal Responsive Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenDispatchModal={() => handleOpenDispatch()}
      />

      {/* Main Content Area - Mobile first container with safe bottom padding for nav bar */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 lg:pb-12 space-y-6 overflow-x-hidden">
        {/* Operations View */}
        {currentTab === 'operations' && (
          <div className="space-y-5">
            {/* Interactive Logistics World Map */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Global Logistics Radar & Moving Fleet
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono hidden xs:inline">
                  Tap truck or hub for details
                </span>
              </div>
              <GlobalLogisticsMap
                onSelectTruck={(truckId) => setInspectedTruckId(truckId)}
                onSelectHub={() => setCurrentTab('hubs')}
              />
            </div>

            {/* Live Active Dispatches & Notifications */}
            <LiveOperations
              onInspectTruck={(truckId) => setInspectedTruckId(truckId)}
              onOpenDispatch={() => handleOpenDispatch()}
            />
          </div>
        )}

        {/* Fleet & Commercial Dealership View */}
        {currentTab === 'fleet' && (
          <FleetManager onInspectTruck={(truckId) => setInspectedTruckId(truckId)} />
        )}

        {/* Freight Market View */}
        {currentTab === 'market' && (
          <FreightMarket onDispatchContract={(contractId) => handleOpenDispatch(contractId)} />
        )}

        {/* Driver Crew & Tachograph View */}
        {currentTab === 'drivers' && <DriverRoster />}

        {/* Regional Hubs & Depots View */}
        {currentTab === 'hubs' && <HubsManager />}

        {/* Financial P&L & Banking View */}
        {currentTab === 'ledger' && <FinancialLedger />}
      </main>

      {/* Floating Mobile Quick Dispatch Action Button */}
      <div className="fixed bottom-20 right-4 z-30 lg:hidden">
        <button
          onClick={() => handleOpenDispatch()}
          aria-label="New Freight Dispatch"
          className="w-13 h-13 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Fixed Mobile Bottom Tab Bar (375px - 1024px) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md lg:hidden h-16 px-2 flex items-center justify-around"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-1 transition-colors ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Desktop Footer (Hidden on mobile to save space) */}
      <footer className="hidden lg:flex border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-xs text-slate-500 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400">HAULMASTER</span>
          <span>·</span>
          <span>High-Fidelity Global Freight Simulation Engine</span>
        </div>

        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 text-slate-500 hover:text-rose-400 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Company Fleet</span>
        </button>
      </footer>

      {/* Full-screen / Bottom-sheet Modals */}
      {inspectedTruckId && (
        <TruckInspectorModal
          truckId={inspectedTruckId}
          onClose={() => setInspectedTruckId(null)}
        />
      )}

      {isDispatchModalOpen && (
        <RouteDispatcherModal
          preselectedContractId={preselectedContractId}
          onClose={() => {
            setIsDispatchModalOpen(false);
            setPreselectedContractId(undefined);
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <DashboardContent />
    </GameProvider>
  );
}
