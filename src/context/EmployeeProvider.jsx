import { createContext, useContext, useEffect, useReducer } from "react";
import { fetchEmployees } from "../utils/api";

const EmployeeStateContext = createContext();
const EmployeeDispatchContext = createContext();

const initialState = {
  employees: [],
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "fetch_start":
      return { ...state, loading: true, error: null };

    case "fetch_success":
      return { ...state, employees: action.payload, loading: false };

    case "fetch_error":
      return { ...state, loading: false, error: action.payload };

    case "add_employee":
      return { ...state, employees: [...state.employees, action.payload] };

    case "update_employee":
      return {
        ...state,
        employees: state.employees.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };

    case "replace_employees":
      return { ...state, employees: action.payload };

    default:
      return state;
  }
}

export function EmployeeProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function load() {
      dispatch({ type: "fetch_start" });

      try {
        const data = await fetchEmployees();
        dispatch({ type: "fetch_success", payload: data });
      } catch (err) {
        dispatch({ type: "fetch_error", payload: err.message });
      }
    }

    load();
  }, []);

  return (
    <EmployeeDispatchContext.Provider value={dispatch}>
      <EmployeeStateContext.Provider value={state}>
        {children}
      </EmployeeStateContext.Provider>
    </EmployeeDispatchContext.Provider>
  );
}

// Hooks
export const useEmployeeState = () => useContext(EmployeeStateContext);
export const useEmployeeDispatch = () => useContext(EmployeeDispatchContext);
