import { useState, useEffect } from "react";
import { data, useParams } from "react-router";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { fetchDocumentSections } from "../api";
import Loading from "./Loading";

const ReaderScreen = () => {
  const { id } = useParams();

  const [document, setDocument] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    fetchDocumentSections(id)
    .then((data) => {
      setDocument(data.document);
      setSections(data.sections);
      setActiveIndex(0)
    })
    .catch((error) => setError(error.message));
  }, [id]);

  if (error) {
    return <p className="p-8 text-red-600">{error}</p>;
  }

  if (!document) {
    return <Loading />
  }

  const activeSection = sections[activeIndex];

  return (
    <div className="flex h-screen bg-slate-50">
      {isSidebarOpen && (
        <aside className="w-65 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-600">
                Reading
              </p>
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {document.filename}
              </h3>
            </div>

            <button onClick={() => setIsSidebarOpen(false)}>
              <PanelLeftClose size={20} color="black" />
            </button>
          </div>

          <nav className="space-y-1">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setActiveIndex(index)}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  index === activeIndex
                    ? "bg-amber-50 font-medium text-amber-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </aside>
      )}

      <main className="flex-1 overflow-y-auto">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-4 top-4 rounded-md border bg-white p-2 shadow hover:bg-slate-50"
          >
            <PanelLeftOpen size={20} color="black" />
          </button>
        )}

        {activeSection && (
          <div className="mx-auto max-w-2xl px-8 py-12">
            <div
              className="max-w-none font-serif text-lg leading-relaxed text-slate-800 [&>p]:mb-5"
              dangerouslySetInnerHTML={{ __html: activeSection.content }}
            />

            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                onClick={() => setActiveIndex((i) => i - 1)}
                disabled={activeIndex === 0}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              <span className="text-xs text-slate-400">
                {activeIndex + 1} of {sections.length}
              </span>
              <button
                onClick={() => setActiveIndex((i) => i + 1)}
                disabled={activeIndex === sections.length - 1}
                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReaderScreen;
