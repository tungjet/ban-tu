import { TextareaHTMLAttributes, forwardRef } from "react";
import FormLabel from "./FormLabel";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  error?: string;
  containerClassName?: string;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, required, error, containerClassName = "", className = "", ...props }, ref) => {
    return (
      <div className={containerClassName}>
        {label && <FormLabel htmlFor={props.id} required={required}>{label}</FormLabel>}
        <textarea
          ref={ref}
          className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder-slate-400 text-slate-900 resize-none ${className}`.trim()}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";
export default FormTextarea;
