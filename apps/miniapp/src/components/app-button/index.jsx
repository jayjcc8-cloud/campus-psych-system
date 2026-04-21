import { Button } from "@tarojs/components";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function AppButton({
  children,
  className = "",
  variant = "primary",
  block = true,
  disabled = false,
  loading = false,
  onClick,
  ...props
}) {
  return (
    <Button
      className={joinClasses("app-button", `app-button-${variant}`, block ? "app-button-block" : "", className)}
      disabled={disabled || loading}
      loading={loading}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
}
