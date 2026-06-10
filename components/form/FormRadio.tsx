import { InputHTMLAttributes, forwardRef } from "react";

interface FormRadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  containerClassName?: string;
}

const FormRadio = forwardRef<HTMLInputElement, FormRadioProps>(
  ({ label, containerClassName = "", className = "", ...props }, ref) => {
    return (
      <label className={`flex items-center gap-2 cursor-pointer ${containerClassName}`.trim()}>
        <input
          ref={ref}
          type="radio"
          className={`w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 ${className}`.trim()}
          {...props}
        />
        <span className="text-sm text-slate-700">{label}</span>
      </label>
    );
  }
);

FormRadio.displayName = "FormRadio";
export default FormRadio;
