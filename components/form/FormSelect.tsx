import { SelectHTMLAttributes, forwardRef, ReactNode } from "react";
import FormLabel from "./FormLabel";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  error?: string;
  containerClassName?: string;
  children: ReactNode;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, required, error, containerClassName = "", className = "", children, ...props }, ref) => {
    return (
      <div className={containerClassName}>
        {label && <FormLabel htmlFor={props.id} required={required}>{label}</FormLabel>}
        <select
          ref={ref}
          className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder-slate-400 text-slate-900 bg-white ${className}`.trim()}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";
export default FormSelect;
