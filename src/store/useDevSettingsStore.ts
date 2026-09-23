import { create } from 'zustand';
import { mockBackend } from '../services/backend/mockBackend';
import { storage } from '../services/storage/storage';

interface DevSettingsState {
  simulate500Error: boolean;
  simulateNetworkDrop: boolean;
  networkLatencyMs: number;
  toggle500Error: () => void;
  toggleNetworkDrop: () => void;
  setNetworkLatency: (ms: number) => void;
  resetAllSettings: () => void;
}

export const useDevSettingsStore = create<DevSettingsState>((set) => {
  const initial500 = storage.getBoolean('dev:simulate500') ?? false;
  mockBackend.simulate500Error = initial500;

  return {
    simulate500Error: initial500,
    simulateNetworkDrop: false,
    networkLatencyMs: 900,

    toggle500Error: () => {
      set((state) => {
        const nextVal = !state.simulate500Error;
        storage.setBoolean('dev:simulate500', nextVal);
        mockBackend.simulate500Error = nextVal;
        return { simulate500Error: nextVal };
      });
    },

    toggleNetworkDrop: () => {
      set((state) => {
        const nextVal = !state.simulateNetworkDrop;
        mockBackend.simulateNetworkDrop = nextVal;
        return { simulateNetworkDrop: nextVal };
      });
    },

    setNetworkLatency: (ms: number) => {
      mockBackend.networkLatencyMs = ms;
      set({ networkLatencyMs: ms });
    },

    resetAllSettings: () => {
      mockBackend.resetAll();
      storage.setBoolean('dev:simulate500', false);
      set({
        simulate500Error: false,
        simulateNetworkDrop: false,
        networkLatencyMs: 900,
      });
    },
  };
});
