import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Upload } from "lucide-react";

import { fetchDocuments, uploadDocument } from "../api";

const UploadScreen = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      await uploadDocument(file);
      setFile(null);
      e.target.reset();
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-8 px-4 sm:px-6">
        <div className="w-full max-w-md mx-auto">
            {/* <h2 className="text-lg font-semibold mb-4">
                Upload Document
            </h2> */}

            <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-white">

                {/* Upload Area */}
                <label
                htmlFor="upload-file"
                className="block border border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:border-gray-400 transition"
                >
                <div className="flex flex-col items-center">

                    <Upload size={22} className="text-gray-500" strokeWidth={2} />

                    <p className="text-sm font-medium mt-2 text-gray-700">
                    Drop file here
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                    or click to browse
                    </p>

                </div>

                <input
                    id="upload-file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                />
                </label>

                {/* Selected File */}
                {file && (
                <div className="mt-3 text-xs text-gray-600 border rounded p-2">
                    <span className="font-medium">Selected:</span> {file.name}
                </div>
                )}

                {/* Upload Button */}
                <button
                type="submit"
                disabled={!file || uploading}
                className="w-full mt-4 bg-black text-white text-sm py-2 rounded-md hover:bg-gray-900 disabled:opacity-50"
                >
                {uploading ? "Uploading..." : "Upload"}
                </button>

                {/* Help Text */}
                <p className="text-[11px] text-center text-gray-400 mt-3">
                Only PDF & DOCX files • Max 50 MB
                </p>

                {error && (
                <p className="text-xs text-red-500 mt-3 text-center">
                    {error}
                </p>
                )}

            </form>
        </div>

        {/* Document List */}

        <div className="w-full max-w-3xl mx-auto mt-10 mb-6">
            <h3 className="text-sm font-semibold mb-3">
            Your Documents
            </h3>

            {documents.length === 0 ? (
            <p className="text-xs text-gray-500">
                No documents uploaded yet.
            </p>
            ) : (
            <ul className="space-y-2">
                {documents.map((doc) => (
                <li
                    key={doc.id}
                    className="border rounded-md px-3 py-2 hover:bg-gray-50 transition"
                >
                    <Link
                    to={`/documents/${doc.id}`}
                    className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
                    >
                        <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                            {doc.filename}
                            </p>
                        </div>

                        <span
                            className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap ${
                                doc.file_type === "docx"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-cyan-100 text-shadow-cyan-800-700"
                            }`}
                        >
                            {doc.file_type}
                        </span>

                        <span
                            className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap  ${
                            doc.status === "ready"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                            {doc.status}
                        </span>
                    </Link>
                </li>
                ))}
            </ul>
            )}

        </div>
    </div>
  );
}

export default UploadScreen;