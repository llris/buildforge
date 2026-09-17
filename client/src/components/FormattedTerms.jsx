import React from 'react';

/**
 * Parses raw plain-text terms content into intro and numbered clauses.
 */
export function parseTerms(content) {
  if (!content) return { intro: '', clauses: [] };

  const lines = content.split('\n');
  const introLines = [];
  const clauses = [];
  let currentClause = null;

  // Regex to match "1. ELIGIBILITY", "2. ACCOUNT REGISTRATION AND SECURITY", etc.
  const headingRegex = /^(\d+)\.\s+([A-Z\s,–\-()]+)$/;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    const headingMatch = trimmed.match(headingRegex);

    if (headingMatch) {
      if (currentClause) {
        clauses.push(currentClause);
      }
      currentClause = {
        number: parseInt(headingMatch[1], 10),
        title: trimmed,
        bodyLines: [],
      };
    } else if (currentClause) {
      currentClause.bodyLines.push(rawLine);
    } else {
      introLines.push(rawLine);
    }
  }

  if (currentClause) {
    clauses.push(currentClause);
  }

  return {
    intro: introLines.join('\n').trim(),
    clauses: clauses.map((c) => ({
      number: c.number,
      title: c.title,
      body: c.bodyLines.join('\n').trim(),
    })),
  };
}

/**
 * Renders formatted Terms content with distinct clause headers and preserved paragraph spacing.
 */
export default function FormattedTerms({ content, isCompact = false }) {
  const { intro, clauses } = parseTerms(content);

  return (
    <div className={`space-y-${isCompact ? '4' : '6'} select-text`}>
      {/* Intro Paragraph */}
      {intro && (
        <div className={`p-4 rounded-xl bg-gray-800/40 border border-gray-800 text-gray-300 ${isCompact ? 'text-xs leading-relaxed' : 'text-sm sm:text-base leading-relaxed'}`}>
          <p className="whitespace-pre-line">{intro}</p>
        </div>
      )}

      {/* 22 Clauses */}
      <div className={`space-y-${isCompact ? '4' : '6'}`}>
        {clauses.map((clause) => (
          <div
            key={clause.number}
            className={`rounded-xl ${
              isCompact
                ? 'p-3.5 bg-gray-900/60 border border-gray-800/80'
                : 'p-5 bg-gray-800/40 border border-gray-700/50 hover:border-gray-600 transition'
            }`}
          >
            {/* Clause Heading */}
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-800/60">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold shrink-0">
                {clause.number}
              </span>
              <h3 className={`font-bold text-white tracking-wide ${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
                {clause.title.replace(/^\d+\.\s+/, '')}
              </h3>
            </div>

            {/* Clause Body */}
            <div className={`text-gray-300 whitespace-pre-line ${isCompact ? 'text-xs leading-relaxed' : 'text-sm sm:text-base leading-relaxed space-y-2'}`}>
              {clause.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
