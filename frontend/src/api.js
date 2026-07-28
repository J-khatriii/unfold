const API_BASE = "http://localhost:4000";

const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/documents`, {
        method: "POST",
        body: formData,
    });

    if(!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
    }

    return res.json();
}

const fetchDocuments = async () => {
  const res = await fetch(`${API_BASE}/documents`);

  if (!res.ok) throw new Error("Failed to fetch documents");

  return res.json();
}

const fetchDocumentSections = async (id) => {
    const res = await fetch(`${API_BASE}/documents/${id}/sections`);

    if(!res.ok) throw new Error("Failed to fetch sections");

    return res.json();
}

export {
    uploadDocument,
    fetchDocuments,
    fetchDocumentSections,
}
