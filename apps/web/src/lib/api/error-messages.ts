import { useTranslations } from "next-intl";
import { getErrorMessage } from "@squademy/shared";

export function useErrorMessage() {
  const t = useTranslations("errors");

  return (code?: string, fallback?: string): string => {
    if (!code) return fallback ?? t("fallback");
    try {
      return t(code);
    } catch {
      return getErrorMessage(code);
    }
  };
}
