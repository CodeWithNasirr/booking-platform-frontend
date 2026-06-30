"use client";

function ext(name = "") {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function isImage(name) {
  return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext(name));
}

export default function AttachmentGrid({ files }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {files.map((f) => (
        <a
          key={f.id}
          href={f.file}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 transition"
        >
          {isImage(f.file_name) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.file} alt={f.file_name} className="w-full h-24 object-cover" />
          ) : (
            <div className="h-24 flex items-center justify-center bg-gray-50 text-xs uppercase font-bold text-gray-400">
              {ext(f.file_name) || "file"}
            </div>
          )}
          <p className="text-xs text-gray-600 px-2 py-1 truncate">{f.file_name}</p>
        </a>
      ))}
    </div>
  );
}
