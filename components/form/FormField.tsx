import { ReactNode } from "react";

interface FormFieldProps {
  children: ReactNode;
  className?: string;
}

export default function FormField({ children, className = "" }: FormFieldProps) {
  return <div className={`space-y-1.5 ${className}`.trim()}>{children}</div>;
}
