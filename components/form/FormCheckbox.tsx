import { InputHTMLAttributes, forwardRef } from "react";

interface FormCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  containerClassName?: string;
}

const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, containerClassName = "", className = "", ...props }, ref) => {
    return (
      <label className={`flex items-center gap-2 cursor-pointer ${containerClassName}`.trim()}>
        <input
          ref={ref}
          type="checkbox"
          className={`w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 ${className}`.trim()}
          {...props}
        />
        <span className="text-sm text-slate-700">{label}</span>
      </label>
    );
  }
);

FormCheckbox.displayName = "FormCheckbox";
export default FormCheckbox;
