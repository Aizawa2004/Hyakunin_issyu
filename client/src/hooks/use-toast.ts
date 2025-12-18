import { toast } from "sonner"

type ToastProps = {
  title?: string;
  description?: string;
  className?: string;
  variant?: "default" | "destructive";
}

export const useToast = () => {
  return {
    toast: ({ title, description, className, variant }: ToastProps) => {
      if (variant === "destructive") {
        toast.error(title, {
          description,
          className,
        });
      } else {
        toast.success(title, {
          description,
          className,
        });
      }
    },
    dismiss: (toastId?: string | number) => toast.dismiss(toastId),
  }
}
