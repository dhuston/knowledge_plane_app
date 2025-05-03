/**
 * HierarchyReducer.ts
 * State management for the organizational hierarchy
 */
import { OrganizationalUnitEntity, OrganizationalUnitTypeEnum } from '../../../types/hierarchy';

// Action types
export enum HierarchyActionType {
  SELECT_UNIT = 'SELECT_UNIT',
  EXPAND_UNIT = 'EXPAND_UNIT',
  COLLAPSE_UNIT = 'COLLAPSE_UNIT',
  TOGGLE_UNIT = 'TOGGLE_UNIT',
  SET_PATH = 'SET_PATH',
  SET_SEARCH_TERM = 'SET_SEARCH_TERM',
  SET_FILTER_TYPE = 'SET_FILTER_TYPE',
  ADD_UNITS = 'ADD_UNITS',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
}

// Action interfaces
interface SelectUnitAction {
  type: HierarchyActionType.SELECT_UNIT;
  payload: string | null;
}

interface ExpandUnitAction {
  type: HierarchyActionType.EXPAND_UNIT;
  payload: string;
}

interface CollapseUnitAction {
  type: HierarchyActionType.COLLAPSE_UNIT;
  payload: string;
}

interface ToggleUnitAction {
  type: HierarchyActionType.TOGGLE_UNIT;
  payload: string;
}

interface SetPathAction {
  type: HierarchyActionType.SET_PATH;
  payload: string[];
}

interface SetSearchTermAction {
  type: HierarchyActionType.SET_SEARCH_TERM;
  payload: string;
}

interface SetFilterTypeAction {
  type: HierarchyActionType.SET_FILTER_TYPE;
  payload: OrganizationalUnitTypeEnum | null;
}

interface AddUnitsAction {
  type: HierarchyActionType.ADD_UNITS;
  payload: Record<string, OrganizationalUnitEntity>;
}

interface SetLoadingAction {
  type: HierarchyActionType.SET_LOADING;
  payload: boolean;
}

interface SetErrorAction {
  type: HierarchyActionType.SET_ERROR;
  payload: string | null;
}

export type HierarchyAction =
  | SelectUnitAction
  | ExpandUnitAction
  | CollapseUnitAction
  | ToggleUnitAction
  | SetPathAction
  | SetSearchTermAction
  | SetFilterTypeAction
  | AddUnitsAction
  | SetLoadingAction
  | SetErrorAction;

// State interface
export interface HierarchyState {
  units: Record<string, OrganizationalUnitEntity>;
  selectedUnitId: string | null;
  expandedUnitIds: string[];
  path: string[];
  searchTerm: string;
  filterType: OrganizationalUnitTypeEnum | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
export const initialHierarchyState: HierarchyState = {
  units: {},
  selectedUnitId: null,
  expandedUnitIds: [],
  path: [],
  searchTerm: '',
  filterType: null,
  isLoading: false,
  error: null,
};

// Reducer function
export function hierarchyReducer(
  state: HierarchyState,
  action: HierarchyAction
): HierarchyState {
  switch (action.type) {
    case HierarchyActionType.SELECT_UNIT:
      return {
        ...state,
        selectedUnitId: action.payload,
        expandedUnitIds: action.payload
          ? [...new Set([...state.expandedUnitIds, action.payload])]
          : state.expandedUnitIds,
      };

    case HierarchyActionType.EXPAND_UNIT:
      return {
        ...state,
        expandedUnitIds: [...new Set([...state.expandedUnitIds, action.payload])],
      };

    case HierarchyActionType.COLLAPSE_UNIT:
      return {
        ...state,
        expandedUnitIds: state.expandedUnitIds.filter(id => id !== action.payload),
      };

    case HierarchyActionType.TOGGLE_UNIT:
      return {
        ...state,
        expandedUnitIds: state.expandedUnitIds.includes(action.payload)
          ? state.expandedUnitIds.filter(id => id !== action.payload)
          : [...state.expandedUnitIds, action.payload],
      };

    case HierarchyActionType.SET_PATH:
      return {
        ...state,
        path: action.payload,
      };

    case HierarchyActionType.SET_SEARCH_TERM:
      return {
        ...state,
        searchTerm: action.payload,
      };

    case HierarchyActionType.SET_FILTER_TYPE:
      return {
        ...state,
        filterType: action.payload,
      };

    case HierarchyActionType.ADD_UNITS:
      return {
        ...state,
        units: { ...state.units, ...action.payload },
      };

    case HierarchyActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case HierarchyActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
}