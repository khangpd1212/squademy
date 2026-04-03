import { downloadMarkdown } from "./markdown-export";

describe("downloadMarkdown", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let mockLink: { href: string; download: string; click: jest.Mock };

  beforeEach(() => {
    jest.useFakeTimers();
    URL.createObjectURL = jest.fn(() => "blob:mock-url");
    URL.revokeObjectURL = jest.fn();
    mockLink = { href: "", download: "", click: jest.fn() };
    jest.spyOn(document, "createElement").mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    jest.spyOn(document.body, "appendChild").mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
    jest.spyOn(document.body, "removeChild").mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
  });

  afterEach(() => {
    jest.useRealTimers();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  it("creates a blob and triggers download", () => {
    downloadMarkdown("# Hello World", "test-lesson");

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockLink.click).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
  });

  it("appends .md extension if not present", () => {
    downloadMarkdown("# Hello", "my-lesson");

    expect(mockLink.download).toBe("my-lesson.md");
  });

  it("preserves .md extension if already present", () => {
    downloadMarkdown("# Hello", "my-lesson.md");

    expect(mockLink.download).toBe("my-lesson.md");
  });

  it("revokes object URL after requestAnimationFrame", () => {
    downloadMarkdown("# Hello", "test");

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
