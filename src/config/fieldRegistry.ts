export interface FieldDefinition {
  label: string;
  component: "InputNumber" | "InputText" | "Select" | "Toggle" | "DateTime";
  props?: Record<string, unknown>;
}

export const FIELD_REGISTRY: Record<string, FieldDefinition> = {
  direction: {
    label: "Direction",
    component: "Toggle",
    props: {
      options: [
        { label: "BUY", value: "BUY", variant: "buy" },
        { label: "SELL", value: "SELL", variant: "sell" },
      ],
    },
  },
  symbol: {
    label: "Symbol",
    component: "InputText", // Typically handled by Header, but registered here just in case
    props: { disabled: true },
  },
  notional: {
    label: "Amount (CCY1)",
    component: "InputNumber",
    props: { min: 1000, step: 100000, placeholder: "1,000,000" },
  },
  limitPrice: {
    label: "Limit Price",
    component: "InputNumber",
    props: { precision: 5, step: 0.0001 },
  },
  stopPrice: {
    label: "Stop Price",
    component: "InputNumber",
    props: { precision: 5, step: 0.0001 },
  },
  liquidityPool: {
    label: "Liquidity Pool",
    component: "Select",
    props: { placeholder: "Select Pool" }, // Options populated dynamically
  },
  account: {
    label: "Account",
    component: "Select",
    props: { placeholder: "Select Account" }, // Options populated dynamically
  },
  timeInForce: {
    label: "Time In Force",
    component: "Select",
    props: {
      options: [
        { label: "Good Till Cancel (GTC)", value: "GTC" },
        { label: "Immediate Or Cancel (IOC)", value: "IOC" },
        { label: "Fill Or Kill (FOK)", value: "FOK" },
        { label: "Good Till Date (GTD)", value: "GTD" },
      ],
    },
  },
  startTime: {
    label: "Start Time",
    component: "DateTime",
    props: {},
  },
};
