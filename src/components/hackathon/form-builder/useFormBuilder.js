import { useRef, useCallback, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { createDefaultField } from "./formFieldDefaults";

/**
 * useFormBuilder — manages form field state with parent sync.
 *
 * Uses a ref-based state to avoid React re-render loops.
 * Calls onChange(newFields) synchronously after each mutation.
 */
export default function useFormBuilder(externalFields = [], onChange) {
  // Use a counter to force re-renders when fields change
  const [, setTick] = useState(0);
  const fieldsRef = useRef(externalFields);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync external fields into ref on first render only
  // (subsequent updates come from internal mutations)
  const initializedRef = useRef(false);
  if (!initializedRef.current) {
    fieldsRef.current = externalFields;
    initializedRef.current = true;
  }

  const [activeFieldId, setActiveFieldId] = useState(null);

  const update = useCallback((newFields) => {
    fieldsRef.current = newFields;
    setTick((t) => t + 1); // force re-render
    if (onChangeRef.current) onChangeRef.current(newFields);
  }, []);

  const dispatch = useCallback((action) => {
    const state = fieldsRef.current;
    let next;

    switch (action.type) {
      case "ADD_FIELD": {
        const newField = createDefaultField(action.fieldType);
        if (!newField) return;
        next = [...state, newField];
        break;
      }
      case "REMOVE_FIELD":
        next = state.filter((f) => f.id !== action.id);
        break;
      case "UPDATE_FIELD":
        next = state.map((f) =>
          f.id === action.id ? { ...f, ...action.updates } : f
        );
        break;
      case "REORDER_FIELDS": {
        const oldIndex = state.findIndex((f) => f.id === action.activeId);
        const newIndex = state.findIndex((f) => f.id === action.overId);
        if (oldIndex === -1 || newIndex === -1) return;
        next = arrayMove(state, oldIndex, newIndex);
        break;
      }
      case "DUPLICATE_FIELD": {
        const source = state.find((f) => f.id === action.id);
        if (!source) return;
        const idx = state.indexOf(source);
        const dup = { ...JSON.parse(JSON.stringify(source)), id: crypto.randomUUID() };
        next = [...state];
        next.splice(idx + 1, 0, dup);
        break;
      }
      case "SET_FIELDS":
        next = action.fields;
        break;
      default:
        return;
    }

    update(next);
  }, [update]);

  return { fields: fieldsRef.current, activeFieldId, setActiveFieldId, dispatch };
}
