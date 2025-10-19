import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DebouncedProgressReporter } from "../debounced-progress";

describe("DebouncedProgressReporter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call onProgress immediately on first report", () => {
    const onProgress = vi.fn();
    const reporter = new DebouncedProgressReporter(onProgress, 100);

    reporter.report("First update");

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith("First update");
  });

  it("should debounce rapid consecutive reports", () => {
    const onProgress = vi.fn();
    const reporter = new DebouncedProgressReporter(onProgress, 100);

    reporter.report("Update 1");
    reporter.report("Update 2");
    reporter.report("Update 3");

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith("Update 1");

    vi.advanceTimersByTime(100);

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith("Update 3");
  });

  it("should report immediately if enough time has passed", () => {
    const onProgress = vi.fn();
    const reporter = new DebouncedProgressReporter(onProgress, 100);

    reporter.report("First");
    vi.advanceTimersByTime(100);
    reporter.report("Second");

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, "First");
    expect(onProgress).toHaveBeenNthCalledWith(2, "Second");
  });

  it("should flush pending status immediately", () => {
    const onProgress = vi.fn();
    const reporter = new DebouncedProgressReporter(onProgress, 100);

    reporter.report("First");
    reporter.report("Pending");

    expect(onProgress).toHaveBeenCalledTimes(1);

    reporter.flush();

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith("Pending");
  });

  it("should not call onProgress when flushing with no pending status", () => {
    const onProgress = vi.fn();
    const reporter = new DebouncedProgressReporter(onProgress, 100);

    reporter.flush();

    expect(onProgress).not.toHaveBeenCalled();
  });

  it("should clear pending status after flush", () => {
    const onProgress = vi.fn();
    const reporter = new DebouncedProgressReporter(onProgress, 100);

    reporter.report("First");
    reporter.report("Pending");
    reporter.flush();

    onProgress.mockClear();
    reporter.flush();

    expect(onProgress).not.toHaveBeenCalled();
  });

  it("should clean up timeout on destroy", () => {
    const onProgress = vi.fn();
    const reporter = new DebouncedProgressReporter(onProgress, 100);

    reporter.report("First");
    reporter.report("Pending");
    reporter.destroy();

    vi.advanceTimersByTime(100);

    expect(onProgress).toHaveBeenCalledTimes(1);
  });

  it("should use custom debounce time", () => {
    const onProgress = vi.fn();
    const reporter = new DebouncedProgressReporter(onProgress, 200);

    reporter.report("First");
    reporter.report("Second");

    vi.advanceTimersByTime(100);
    expect(onProgress).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith("Second");
  });
});
