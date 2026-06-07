/**
 * UI Store - Zustand
 * 
 * Lightweight client-side state for UI concerns like:
 * - Modal states
 * - Sidebar state
 * - Selected filters
 * - Temporary form data
 * 
 * This is simpler and more performant than Redux for UI state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ModalState {
  type: 'deal' | 'posp' | null;
  isOpen: boolean;
  data?: unknown;
}

interface FilterState {
  status: string | null;
  pospId: string | null;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Modal
  modal: ModalState;
  openModal: (type: 'deal' | 'posp', data?: unknown) => void;
  closeModal: () => void;

  // Filters
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: unknown) => void;
  resetFilters: () => void;

  // Selected items (for bulk operations)
  selectedDealIds: Set<string>;
  toggleDealSelection: (id: string) => void;
  selectAllDeals: (ids: string[]) => void;
  clearDealSelection: () => void;

  // Location selection (for forms)
  selectedState: string | null;
  selectedDistrict: string | null;
  selectedCity: string | null;
  setSelectedState: (stateId: string | null) => void;
  setSelectedDistrict: (districtId: string | null) => void;
  setSelectedCity: (cityId: string | null) => void;
  resetLocationSelection: () => void;
}

const initialFilters: FilterState = {
  status: null,
  pospId: null,
  dateRange: {
    start: null,
    end: null,
  },
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Modal
      modal: { type: null, isOpen: false },
      openModal: (type, data) =>
        set({ modal: { type, isOpen: true, data } }),
      closeModal: () =>
        set({ modal: { type: null, isOpen: false, data: undefined } }),

      // Filters
      filters: initialFilters,
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      resetFilters: () => set({ filters: initialFilters }),

      // Selected items
      selectedDealIds: new Set(),
      toggleDealSelection: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedDealIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedDealIds: newSet };
        }),
      selectAllDeals: (ids) =>
        set({ selectedDealIds: new Set(ids) }),
      clearDealSelection: () =>
        set({ selectedDealIds: new Set() }),

      // Location selection
      selectedState: null,
      selectedDistrict: null,
      selectedCity: null,
      setSelectedState: (stateId) =>
        set({
          selectedState: stateId,
          // Reset dependent selections
          selectedDistrict: null,
          selectedCity: null,
        }),
      setSelectedDistrict: (districtId) =>
        set({
          selectedDistrict: districtId,
          // Reset dependent selection
          selectedCity: null,
        }),
      setSelectedCity: (cityId) =>
        set({ selectedCity: cityId }),
      resetLocationSelection: () =>
        set({
          selectedState: null,
          selectedDistrict: null,
          selectedCity: null,
        }),
    }),
    {
      name: 'roinet-ui-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain keys
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        filters: state.filters,
      }),
    },
  ),
);
