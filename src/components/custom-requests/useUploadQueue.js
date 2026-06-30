"use client";

/**
 * useUploadQueue
 *
 * Tiny state machine that hosts use to drive multi-file uploads
 * with progress / cancel / retry / dismiss. Host-agnostic — pass
 * an `upload(file, { onProgress, signal })` function and the
 * hook handles the rest.
 *
 * Returned API:
 *   queue       — array of { id, file, progress, state, error }
 *                 state ∈ "pending" | "uploading" | "done"
 *                       | "error" | "cancelled"
 *   busy        — true while any item is pending or uploading
 *   enqueue     — (FileList | File[]) → starts upload of each
 *   cancel      — (id) → abort the in-flight request
 *   retry       — (id) → re-run an errored or cancelled item
 *   dismiss     — (id) → remove a row from the tray (done, error,
 *                       or cancelled rows only)
 *   clearDone   — drop all "done" rows; pages call this on a
 *                 setTimeout to fade success tiles automatically
 */

import { useCallback, useMemo, useRef, useState } from "react";

function makeId() {
  return `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function useUploadQueue({ upload }) {
  const [queue, setQueue] = useState([]);
  const controllersRef = useRef(new Map());

  const patch = useCallback((id, p) => {
    setQueue((q) => q.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }, []);

  const runOne = useCallback(async (item) => {
    const ctrl = new AbortController();
    controllersRef.current.set(item.id, ctrl);
    patch(item.id, { state: "uploading", progress: 0, error: null });
    try {
      await upload(item.file, {
        onProgress: (p) => patch(item.id, { progress: p }),
        signal: ctrl.signal,
      });
      patch(item.id, { state: "done", progress: 1 });
    } catch (err) {
      if (err?.name === "AbortError") {
        patch(item.id, { state: "cancelled" });
      } else {
        patch(item.id, { state: "error", error: err?.message || "Upload failed" });
      }
    } finally {
      controllersRef.current.delete(item.id);
    }
  }, [upload, patch]);

  const enqueue = useCallback((files) => {
    if (!files) return;
    const list = Array.from(files);
    if (list.length === 0) return;
    const items = list.map((f) => ({
      id: makeId(),
      file: f,
      progress: 0,
      state: "pending",
      error: null,
    }));
    setQueue((q) => [...q, ...items]);
    for (const item of items) runOne(item);
  }, [runOne]);

  const cancel = useCallback((id) => {
    controllersRef.current.get(id)?.abort();
  }, []);

  const retry = useCallback((id) => {
    setQueue((q) => {
      const item = q.find((x) => x.id === id);
      if (!item) return q;
      runOne(item);
      return q.map((x) => (x.id === id ? { ...x, state: "pending", progress: 0, error: null } : x));
    });
  }, [runOne]);

  const dismiss = useCallback((id) => {
    setQueue((q) => q.filter((x) => x.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setQueue((q) => q.filter((x) => x.state !== "done"));
  }, []);

  const busy = useMemo(
    () => queue.some((x) => x.state === "pending" || x.state === "uploading"),
    [queue],
  );

  return { queue, busy, enqueue, cancel, retry, dismiss, clearDone };
}
