export const detectRepeatingBoundaryText = (pages) => {
  const candidates = {};

  pages.forEach((items) => {
    items.forEach(({ text, y, height }) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const isNearTop = y > height * 0.9;
      const isNearBottom = y < height * 0.1;
      if (!isNearTop && !isNearBottom) return;

      const key = trimmed.replace(/\d+/g, '#'); // normalize "Page 3" and "Page 4" to the same key
      candidates[key] = (candidates[key] || 0) + 1;
    });
  });

  const pageCount = pages.length;

  return new Set(
    Object.entries(candidates)
      .filter(([, count]) => count >= pageCount * 0.6) // appears on most pages
      .map(([key]) => key)
  );
}

export const removeNoiseLines = (pages) => {
  const boundaryPatterns = detectRepeatingBoundaryText(pages);

  return pages.map((items) => {
    return items
      .filter(({ text }) => {
        const trimmed = text.trim();
        if (!trimmed) return false;
        const normalized = trimmed.replace(/\d+/g, '#');
        return !boundaryPatterns.has(normalized);
      })
      .map((item) => item.text)
      .join(' ');
  });
}
