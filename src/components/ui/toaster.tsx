import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={4500} swipeDirection="down">
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const alertText = `${typeof title === "string" ? title : ""} ${typeof description === "string" ? description : ""}`;
        const isDestructive = variant === "destructive" || /erro|falha|inválid|não foi possível|não é possível|expirou|negad|recusad/i.test(alertText);
        const resolvedVariant = isDestructive ? "destructive" : variant;
        return (
          <Toast key={id} variant={resolvedVariant} {...props}>
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] text-white ${isDestructive ? "bg-gradient-to-br from-red-400 to-red-600 shadow-[0_5px_16px_rgba(239,68,68,0.28)]" : "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_5px_16px_rgba(16,185,129,0.28)]"}`}>
              {isDestructive ? <AlertCircle size={19} strokeWidth={2.15} /> : <CheckCircle2 size={19} strokeWidth={2.15} />}
            </div>
            <div className="min-w-0 flex-1 grid gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
