"use client";

import { useRef, useState } from "react";

const PLACEHOLDER_INACCURACIES = [
  "The definition provided for the core concept was partially incomplete — the boundary condition was not addressed.",
  "The formula cited in question 3 omits the normalization coefficient, which is required for the general case.",
  "The diagram description in part (b) conflates two distinct processes that should be described separately.",
];

const PLACEHOLDER_IMPROVEMENTS = [
  "Consider expanding on the relationship between the input and output variables with a concrete numerical example.",
  "Your explanation in section 2 would benefit from referencing the formal theorem stated in lecture 4.",
  "Add a brief conclusion that connects your findings back to the original problem statement.",
];

const feedbackColorMap = {
  red: {
    bg: "bg-red-50 dark:bg-red-500/10",
    border: "border-red-100 dark:border-red-500/20",
    title: "text-red-700 dark:text-red-400",
    text: "text-red-800 dark:text-red-300",
    dot: "bg-red-500",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-100 dark:border-amber-500/20",
    title: "text-amber-700 dark:text-amber-400",
    text: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
  },
};

function FeedbackSection({
  title,
  items,
  color,
  icon,
}: {
  title: string;
  items: string[];
  color: keyof typeof feedbackColorMap;
  icon: React.ReactNode;
}) {
  const c = feedbackColorMap[color];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg} ${c.title}`}>
          {icon}
        </div>
        <h4 className={`font-bold ${c.title}`}>{title}</h4>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 rounded-xl border ${c.bg} ${c.border} px-4 py-3 text-sm ${c.text}`}
          >
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomeworkTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSubmitted(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setSubmitted(false);
    }
  }

  function handleSubmit() {
    if (selectedFile) setSubmitted(true);
  }

  function removeFile() {
    setSelectedFile(null);
    setSubmitted(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Upload Card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100 dark:bg-[#151515] dark:border-white/5 dark:ring-white/5 p-6 sm:p-8 flex flex-col gap-5">
        {/* Section Header */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upload Homework</h2>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
          Upload your completed homework as a PDF. The AI will review your answers, flag inaccuracies, and suggest improvements to help you avoid losing points.
        </p>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-3 text-center transition-colors
            ${isDragOver
              ? "border-blue-400 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500"
              : "border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${isDragOver ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Drag &amp; drop your PDF here, or{" "}
              <span className="text-blue-600 dark:text-blue-400">click to browse</span>
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">PDF files only · Max 10 MB</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Selected File Chip */}
        {selectedFile && (
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); removeFile(); }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedFile}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          Submit for Review
        </button>
      </div>

      {/* Feedback Card */}
      <div className={`rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100 dark:bg-[#151515] dark:border-white/5 dark:ring-white/5 p-6 sm:p-8 flex flex-col gap-6 transition-opacity duration-300 ${submitted ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        {/* Section Header */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Review Feedback</h2>
        </div>

        {!submitted ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Submit your homework above to see AI feedback here.
            </p>
          </div>
        ) : (
          <>
            <FeedbackSection
              title="Inaccuracies Found"
              items={PLACEHOLDER_INACCURACIES}
              color="red"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              }
            />
            <div className="border-t border-gray-100 dark:border-white/5" />
            <FeedbackSection
              title="Points for Improvement"
              items={PLACEHOLDER_IMPROVEMENTS}
              color="amber"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
