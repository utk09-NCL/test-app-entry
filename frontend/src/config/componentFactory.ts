/**
 * Component Factory - Type Helpers for Field Components
 *
 * This module provides type predicates and helpers for determining
 * which component to render based on the field definition.
 *
 * Benefits:
 * - Type-safe component selection
 * - Single place to add new field types
 * - Keeps FieldRenderer focused on rendering logic
 */

import { FieldDefinition } from "./fieldRegistry";

/**
 * Get default input type for a component
 */
export const getInputType = (component: FieldDefinition["component"]): "text" | "number" => {
  switch (component) {
    case "InputNumber":
    case "AmountWithCurrency":
    case "LimitPriceWithCheckbox":
      return "number";
    default:
      return "text";
  }
};

/**
 * Check if a component type is a Select
 */
export const isSelectComponent = (component: FieldDefinition["component"]): boolean => {
  return component === "Select";
};

/**
 * Check if a component type is a Toggle
 */
export const isToggleComponent = (component: FieldDefinition["component"]): boolean => {
  return component === "Toggle";
};

/**
 * Check if a component type is AmountWithCurrency
 */
export const isAmountWithCurrencyComponent = (component: FieldDefinition["component"]): boolean => {
  return component === "AmountWithCurrency";
};

/**
 * Check if a component type is LimitPriceWithCheckbox
 */
export const isLimitPriceComponent = (component: FieldDefinition["component"]): boolean => {
  return component === "LimitPriceWithCheckbox";
};

/**
 * Check if a component type is InputTime
 */
export const isInputTimeComponent = (component: FieldDefinition["component"]): boolean => {
  return component === "InputTime";
};

/**
 * Check if a component type is InputDate
 */
export const isInputDateComponent = (component: FieldDefinition["component"]): boolean => {
  return component === "InputDate";
};

/**
 * Check if a component type is RangeSlider
 */
export const isRangeSliderComponent = (component: FieldDefinition["component"]): boolean => {
  return component === "RangeSlider";
};

/**
 * Check if a component type requires special handling (not a basic Input)
 */
export const isSpecialComponent = (component: FieldDefinition["component"]): boolean => {
  return (
    component === "AmountWithCurrency" ||
    component === "LimitPriceWithCheckbox" ||
    component === "Toggle" ||
    component === "RangeSlider" ||
    component === "InputTime" ||
    component === "InputDate"
  );
};
