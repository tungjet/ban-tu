import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
  containerClassName?: string;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ leadingIcon, containerClassName = "", className = "", ...props }, ref) => {
    const inputClass = "w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 text-slate-900";

    return (
      <div className={containerClassName}>
        {leadingIcon ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leadingIcon}
            </span>
            <input ref={ref} className={`${inputClass} pl-10 ${className}`.trim()} {...props} />
          </div>
        ) : (
          <input ref={ref} className={`${inputClass} ${className}`.trim()} {...props} />
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
export default SearchInput;
