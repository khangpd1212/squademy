import "@testing-library/jest-dom";

jest.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string, values?: Record<string, unknown>) => {
      if (!values) return key;
      return Object.entries(values).reduce((acc, [name, value]) => {
        return acc.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
      }, key);
    },
  NextIntlClientProvider: ({ children }: { children: unknown }) => children,
  useLocale: () => "en",
  useMessages: () => ({}),
  useNow: () => new Date("2026-01-01T00:00:00.000Z"),
  useTimeZone: () => "UTC",
}));
