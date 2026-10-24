import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { GlobalLogisticsMap } from './components/GlobalLogisticsMap';
import { LiveOperations } from './components/LiveOperations';
import { FleetManager } from './components/FleetManager';
import { FreightMarket } from './components/FreightMarket';
import { Marketplace } from './components/Marketplace';
import { DriverRoster } from './components/DriverRoster';
import { HubsManager } from './components/HubsManager';
import { FinancialLedger } from './components/FinancialLedger';
import { GrantsAndLoansPage } from './components/GrantsAndLoansPage';
import { AchievementsPage } from './components/AchievementsPage';
import { TruckInspectorModal } from './components/TruckInspectorModal';
import { RouteDispatcherModal } from './components/RouteDispatcherModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { UserGuideWalkthrough } from './components/UserGuideWalkthrough';
import { CompanyProfilePage } from './components/CompanyProfilePage';
import { CompanyProfileModal } from './components/CompanyProfileModal';
import { OfflineProgressModal } from './components/OfflineProgressModal';
import { DatabaseManagerModal } from './components/DatabaseManagerModal';
import { AiDispatcherPage } from './components/AiDispatcherPage';
import { RepairWorkshopPage } from './components/RepairWorkshopPage';
import { AiQuickActionModal } from './components/AiQuickActionModal';
import { IncidentsAndEventsPage } from './components/IncidentsAndEventsPage';
import { EnterpriseExchangePage } from './components/EnterpriseExchangePage';
import {
  Activity,
  Truck,
  Package,
  ShoppingBag,
  Users,
  MapPin,
  DollarSign,
  PlusCircle,
  RotateCcw,
  Compass,
  HelpCircle,
  X,
  Bell,
  Trophy,
  Wrench,
  Brain,
  Radio,
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { state, resetGame, restartOnboarding, setShowGuide, dismissNotification } = useGame();
  const [currentTab, setCurrentTab] = useState<string>('operations');
  const [inspectedTruckId, setInspectedTruckId] = useState<string | null>(null);
  const [workshopTruckId, setWorkshopTruckId] = useState<string | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [isCompanyProfileOpen, setIsCompanyProfileOpen] = useState<boolean>(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [isAiQuickModalOpen, setIsAiQuickModalOpen] = useState<boolean>(false);
  const [eventsInitialTab, setEventsInitialTab] = useState<'events' | 'incidents' | 'insurance' | 'gold'>('events');
  const [preselectedContractId, setPreselectedContractId] = useState<string | undefined>(undefined);

  const handleOpenDispatch = (contractId?: string) => {
    setPreselectedContractId(contractId);
    setIsDispatchModalOpen(true);
  };

  const handleOpenEventsModal = (tab: 'events' | 'incidents' | 'insurance' | 'gold' = 'events') => {
    setEventsInitialTab(tab);
    setCurrentTab('events');
  };

  const isSubActive = !!(state?.aiDispatcherActive && (state?.simTimeMinutes || 0) < (state?.aiSubscriptionExpiresSimMinutes || 0));

  const mobileNavItems = [
    { id: 'operations', label: 'Ops', icon: Activity },
    { id: 'fleet', label: 'Fleet', icon: Truck },
    { id: 'freight', label: 'Jobs', icon: Package },
    { id: 'market', label: 'Market', icon: ShoppingBag },
    { id: 'hubs', label: 'Hubs', icon: MapPin },
    { id: 'drivers', label: 'Crew', icon: Users },
    { id: 'ledger', label: 'P&L', icon: DollarSign },
  ];

  // Latest notification toast
  const latestNotif = state.notifications[0];

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden w-full relative">
      {/* Universal Responsive Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenDispatchModal={() => handleOpenDispatch()}
        onOpenCompanyProfile={() => setIsCompanyProfileOpen(true)}
        onOpenDatabaseModal={() => setIsDbModalOpen(true)}
        onOpenAiDispatcher={() => setIsAiQuickModalOpen(true)}
        onOpenEventsModal={handleOpenEventsModal}
      />

      {/* Floating System Notification Toast (Non-blocking replacement for window.alert) */}
      {latestNotif && Date.now() - latestNotif.timestamp < 12000 && (
        <div className="fixed top-16 right-4 z-40 max-w-sm w-full bg-slate-900/95 border border-amber-500/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate">{latestNotif.title}</span>
              <span className="text-[10px] font-mono text-slate-500">{latestNotif.simTimeFormatted}</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
              {latestNotif.message}
            </p>
          </div>
          <button
            onClick={() => dismissNotification(latestNotif.id)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
          <FleetManager
            onInspectTruck={(truckId) => setInspectedTruckId(truckId)}
            onOpenWorkshop={(truckId) => {
              setWorkshopTruckId(truckId);
              setCurrentTab('repair');
            }}
          />
        )}

        {/* Fleet Workshop & Subsystem Repair Bay View */}
        {currentTab === 'repair' && (
          <RepairWorkshopPage
            initialTruckId={workshopTruckId}
            onInspectTruck={(truckId) => setInspectedTruckId(truckId)}
          />
        )}

        {/* Freight Jobs View (Filtered strictly for user's owned routes & hubs) */}
        {currentTab === 'freight' && (
          <FreightMarket onDispatchContract={(contractId) => handleOpenDispatch(contractId)} />
        )}

        {/* Real Marketplace View (Hub Concessions, Route Connections to selected hub, Dealership) */}
        {currentTab === 'market' && (
          <Marketplace />
        )}

        {/* Driver Crew & Tachograph View */}
        {currentTab === 'drivers' && <DriverRoster />}

        {/* Regional Hubs & Depots View */}
        {currentTab === 'hubs' && <HubsManager />}

        {/* Financial P&L & Banking View */}
        {currentTab === 'ledger' && <FinancialLedger onOpenLoansPage={() => setCurrentTab('loans')} />}

        {/* Standalone Grants and Loans Corporate Page */}
        {currentTab === 'loans' && <GrantsAndLoansPage onBackToLedger={() => setCurrentTab('ledger')} />}

        {/* Achievements & Executive Rewards Full Page View */}
        {currentTab === 'achievements' && <AchievementsPage />}

        {/* AI Dispatcher Full Page View */}
        {currentTab === 'ai' && <AiDispatcherPage onOpenDispatch={(contractId) => handleOpenDispatch(contractId)} />}

        {/* Global Events & Commercial Risk Bureau Full Page View */}
        {currentTab === 'events' && (
          <IncidentsAndEventsPage
            initialTab={eventsInitialTab}
            onOpenWorkshop={(truckId) => {
              setWorkshopTruckId(truckId);
              setCurrentTab('repair');
            }}
            onSelectTab={setCurrentTab}
          />
        )}

        {/* Enterprise Exchange & International Trade Full Page View */}
        {currentTab === 'exchange' && (
          <EnterpriseExchangePage onOpenLedger={() => setCurrentTab('ledger')} />
        )}

        {/* Company Profile Full Page View */}
        {currentTab === 'profile' && <CompanyProfilePage onOpenAchievements={() => setCurrentTab('achievements')} onOpenDatabase={() => setIsDbModalOpen(true)} onOpenAiPage={() => setCurrentTab('ai')} onOpenExchange={() => setCurrentTab('exchange')} />}
      </main>

      {/* Floating Mobile AI Quick Action Button (only displayed when AI subscription is active) */}
      {isSubActive && (
        <div className="fixed bottom-20 right-4 z-30 lg:hidden">
          <button
            onClick={() => setIsAiQuickModalOpen(true)}
            aria-label="AI Dispatcher Quick Actions"
            className="w-13 h-13 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer animate-pulse border-2 border-cyan-200"
          >
            <Brain className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Fixed Mobile Bottom Tab Bar (375px - 1024px) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md lg:hidden h-16 px-1 flex items-center justify-around overflow-x-auto no-scrollbar"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] py-1 transition-colors cursor-pointer ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Full-screen / Bottom-sheet Modals */}
      {inspectedTruckId && (
        <TruckInspectorModal
          truckId={inspectedTruckId}
          onClose={() => setInspectedTruckId(null)}
          onOpenWorkshop={(truckId) => {
            setWorkshopTruckId(truckId);
            setInspectedTruckId(null);
            setCurrentTab('repair');
          }}
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

      {isCompanyProfileOpen && (
        <CompanyProfileModal
          onClose={() => setIsCompanyProfileOpen(false)}
          onOpenAchievements={() => {
            setIsCompanyProfileOpen(false);
            setCurrentTab('achievements');
          }}
        />
      )}

      {isAiQuickModalOpen && (
        <AiQuickActionModal
          onClose={() => setIsAiQuickModalOpen(false)}
          onOpenAiPage={() => setCurrentTab('ai')}
        />
      )}

      {/* Database & Storage Manager Modal */}
      <DatabaseManagerModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />



      {/* New User Onboarding Setup Wizard (Automatic on new game, or via restart) */}
      {!state.hasCompletedOnboarding && (
        <OnboardingWizard />
      )}

      {/* Skippable Quick Operations Field Guide */}
      {state.showGuide && (
        <UserGuideWalkthrough />
      )}

      {/* Offline Fleet Progress Report Modal */}
      <OfflineProgressModal />
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
