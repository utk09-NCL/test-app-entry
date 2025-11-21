import styles from "./ToggleSwitch.module.scss";

interface ToggleProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string; variant?: string }[];
  "data-testid"?: string;
  id?: string;
}

export const ToggleSwitch = ({
  value,
  onChange,
  options,
  "data-testid": testId,
  id,
}: ToggleProps) => {
  return (
    <div
      className={styles.container}
      data-testid={testId}
      role="group"
      id={id}
      aria-labelledby={id ? `label-for-${id}` : undefined}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            data-testid={`${testId}-option-${opt.value}`}
            onClick={() => onChange(opt.value)}
            className={`${styles.button} ${isActive ? styles.active : ""} ${
              isActive && opt.variant ? styles[opt.variant] : ""
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
