// src/lib/uploadWithProgress.js
//
// Thin XMLHttpRequest wrapper that exposes real upload progress
// and honours an AbortSignal. fetch() doesn't surface
// XMLHttpRequestUpload.onprogress, so for any place that wants a
// progress bar this is the helper to use.
//
// Returns the parsed JSON body on success. Throws DOMException
// "AbortError" on cancel so callers can branch cleanly. Other
// failures throw Error with the status code in the message.

export function uploadWithProgress(url, formData, opts = {}) {
  const { headers = {}, onProgress, signal, withCredentials = true } = opts;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    for (const [k, v] of Object.entries(headers)) {
      if (v != null) xhr.setRequestHeader(k, v);
    }
    xhr.withCredentials = withCredentials;

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      onProgress?.(e.loaded / e.total);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(xhr.responseText ? JSON.parse(xhr.responseText) : {}); }
        catch { resolve({}); }
      } else {
        const err = new Error(`Upload failed (${xhr.status})`);
        err.status = xhr.status;
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () => reject(new DOMException("Upload aborted", "AbortError"));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(formData);
  });
}
