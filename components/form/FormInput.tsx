import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import FormLabel from "./FormLabel";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  leadingIcon?: ReactNode;
  containerClassName?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, required, error, leadingIcon, containerClassName = "", className = "", ...props }, ref) => {
    const inputClass = leadingIcon
      ? "w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder-slate-400 text-slate-900"
      : "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder-slate-400 text-slate-900";

    return (
      <div className={containerClassName}>
        {label && <FormLabel htmlFor={props.id} required={required}>{label}</FormLabel>}
        {leadingIcon ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leadingIcon}
            </span>
            <input ref={ref} className={`${inputClass} ${className}`.trim()} {...props} />
          </div>
        ) : (
          <input ref={ref} className={`${inputClass} ${className}`.trim()} {...props} />
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
export default FormInput;
