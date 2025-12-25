/**
 * Enhanced Search Box with Autocomplete
 *
 * Supports operators: tag:, type:, tier:, ext:, folder:, is:
 * Provides autocomplete suggestions based on context
 */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { FileMetadata } from '../../types/storage';
import './SearchBox.css';

interface SearchOperator {
  operator: string;
  description: string;
  values?: string[];
  icon: string;
}

const SEARCH_OPERATORS: SearchOperator[] = [
  {
    operator: 'tag:',
    description: 'Filter by tag',
    icon: '🏷️',
  },
  {
    operator: 'type:',
    description: 'Filter by file type',
    values: ['video', 'image', 'audio', 'document', 'folder', 'archive'],
    icon: '📄',
  },
  {
    operator: 'tier:',
    description: 'Filter by storage tier',
    values: ['hot', 'cold', 'nearline'],
    icon: '🔥',
  },
  {
    operator: 'ext:',
    description: 'Filter by extension',
    values: ['mp4', 'mov', 'jpg', 'png', 'pdf', 'doc', 'zip'],
    icon: '📎',
  },
  {
    operator: 'is:',
    description: 'Filter by property',
    values: ['folder', 'file', 'hidden', 'cached', 'tagged'],
    icon: '✓',
  },
  {
    operator: 'size:',
    description: 'Filter by size (e.g., >10mb, <1gb)',
    values: ['>1mb', '>10mb', '>100mb', '>1gb', '<1mb', '<10mb'],
    icon: '📊',
  },
  {
    operator: 'modified:',
    description: 'Filter by modification date',
    values: ['today', 'yesterday', 'week', 'month', 'year'],
    icon: '📅',
  },
];

interface Suggestion {
  type: 'operator' | 'value' | 'tag' | 'folder' | 'file';
  value: string;
  display: string;
  description?: string;
  icon?: string;
}

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  files: FileMetadata[];
  placeholder?: string;
}

export function SearchBox({
  value,
  onChange,
  files,
  placeholder = 'Search files...',
}: SearchBoxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract unique tags from files
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    files.forEach((f) => {
      (f.tags || []).forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [files]);

  // Extract unique extensions from files
  const availableExtensions = useMemo(() => {
    const exts = new Set<string>();
    files.forEach((f) => {
      if (!f.isDirectory) {
        const ext = f.name.split('.').pop()?.toLowerCase();
        if (ext && ext.length <= 10) exts.add(ext);
      }
    });
    return Array.from(exts).sort();
  }, [files]);

  // Extract folder names for suggestions
  const folderNames = useMemo(() => {
    return files.filter((f) => f.isDirectory).map((f) => f.name);
  }, [files]);

  // Get current word being typed (for context-aware suggestions)
  const getCurrentContext = useCallback((): {
    prefix: string;
    operator?: string;
    partialValue: string;
  } => {
    const cursorPos = inputRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1] || '';

    // Check if we're typing an operator value (e.g., "tag:val")
    const operatorMatch = currentWord.match(/^([a-z]+:)(.*)$/i);
    if (operatorMatch) {
      return {
        prefix: textBeforeCursor.slice(0, -currentWord.length),
        operator: operatorMatch[1].toLowerCase(),
        partialValue: operatorMatch[2],
      };
    }

    return {
      prefix: textBeforeCursor.slice(0, -currentWord.length),
      partialValue: currentWord,
    };
  }, [value]);

  // Generate suggestions based on current context
  const suggestions = useMemo((): Suggestion[] => {
    if (!isFocused) return [];

    const ctx = getCurrentContext();
    const results: Suggestion[] = [];

    if (ctx.operator) {
      // Suggest values for the current operator
      const op = SEARCH_OPERATORS.find((o) => o.operator === ctx.operator);

      if (ctx.operator === 'tag:') {
        // Suggest tags
        availableTags
          .filter((t) =>
            t.toLowerCase().includes(ctx.partialValue.toLowerCase()),
          )
          .slice(0, 8)
          .forEach((tag) => {
            results.push({
              type: 'tag',
              value: `tag:${tag}`,
              display: tag,
              icon: '🏷️',
            });
          });
      } else if (ctx.operator === 'ext:') {
        // Suggest extensions
        const extValues = [
          ...new Set([...availableExtensions, ...(op?.values || [])]),
        ];
        extValues
          .filter((e) =>
            e.toLowerCase().includes(ctx.partialValue.toLowerCase()),
          )
          .slice(0, 8)
          .forEach((ext) => {
            results.push({
              type: 'value',
              value: `ext:${ext}`,
              display: `.${ext}`,
              icon: '📎',
            });
          });
      } else if (op?.values) {
        // Suggest predefined values
        op.values
          .filter((v) =>
            v.toLowerCase().includes(ctx.partialValue.toLowerCase()),
          )
          .forEach((val) => {
            results.push({
              type: 'value',
              value: `${ctx.operator}${val}`,
              display: val,
              icon: op.icon,
            });
          });
      }
    } else if (ctx.partialValue === '' && value.trim() === '') {
      // Show operator hints when input is empty
      SEARCH_OPERATORS.slice(0, 6).forEach((op) => {
        results.push({
          type: 'operator',
          value: op.operator,
          display: op.operator,
          description: op.description,
          icon: op.icon,
        });
      });
    } else if (ctx.partialValue.length > 0) {
      // Check if typing looks like start of an operator
      SEARCH_OPERATORS.filter((op) =>
        op.operator.startsWith(ctx.partialValue.toLowerCase()),
      ).forEach((op) => {
        results.push({
          type: 'operator',
          value: op.operator,
          display: op.operator,
          description: op.description,
          icon: op.icon,
        });
      });

      // Also suggest matching file names
      files
        .filter((f) =>
          f.name.toLowerCase().includes(ctx.partialValue.toLowerCase()),
        )
        .slice(0, 5)
        .forEach((f) => {
          results.push({
            type: f.isDirectory ? 'folder' : 'file',
            value: f.name,
            display: f.name,
            icon: f.isDirectory ? '📁' : '📄',
          });
        });

      // Suggest matching tags
      availableTags
        .filter((t) => t.toLowerCase().includes(ctx.partialValue.toLowerCase()))
        .slice(0, 3)
        .forEach((tag) => {
          results.push({
            type: 'tag',
            value: `tag:${tag}`,
            display: `tag:${tag}`,
            icon: '🏷️',
          });
        });
    }

    return results.slice(0, 10);
  }, [
    isFocused,
    getCurrentContext,
    value,
    availableTags,
    availableExtensions,
    files,
  ]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      if (suggestions[selectedIndex]) {
        e.preventDefault();
        applySuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  // Apply a suggestion
  const applySuggestion = (suggestion: Suggestion) => {
    const ctx = getCurrentContext();

    if (suggestion.type === 'operator') {
      // Insert operator
      const newValue = ctx.prefix + suggestion.value;
      onChange(newValue);
    } else {
      // Insert complete value
      const newValue = ctx.prefix + suggestion.value + ' ';
      onChange(newValue);
    }

    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions.length]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse active filters for display
  const activeFilters = useMemo(() => {
    const filters: { operator: string; value: string }[] = [];
    const patterns = [
      /tag:(\S+)/gi,
      /type:(\S+)/gi,
      /tier:(\S+)/gi,
      /ext:(\S+)/gi,
      /is:(\S+)/gi,
      /size:(\S+)/gi,
      /modified:(\S+)/gi,
    ];

    patterns.forEach((pattern) => {
      const matches = value.matchAll(pattern);
      for (const match of matches) {
        const op = match[0].split(':')[0];
        filters.push({ operator: op, value: match[1] });
      }
    });

    return filters;
  }, [value]);

  return (
    <div className="search-box-container">
      <div className={`search-box ${isFocused ? 'focused' : ''}`}>
        <svg
          className="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        {/* Active filter pills */}
        {activeFilters.length > 0 && (
          <div className="filter-pills">
            {activeFilters.map((f, i) => (
              <span key={i} className={`filter-pill ${f.operator}`}>
                <span className="pill-operator">{f.operator}:</span>
                <span className="pill-value">{f.value}</span>
                <button
                  className="pill-remove"
                  onClick={() => {
                    const pattern = new RegExp(
                      `${f.operator}:${f.value}\\s*`,
                      'i',
                    );
                    onChange(value.replace(pattern, '').trim());
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          placeholder={
            activeFilters.length > 0 ? 'Add more filters...' : placeholder
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className={activeFilters.length > 0 ? 'has-filters' : ''}
        />

        {value && (
          <button className="clear-btn" onClick={() => onChange('')}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isFocused && suggestions.length > 0 && (
        <div ref={dropdownRef} className="search-suggestions">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className={`suggestion-item ${i === selectedIndex ? 'selected' : ''} ${s.type}`}
              onClick={() => applySuggestion(s)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="suggestion-icon">{s.icon}</span>
              <span className="suggestion-content">
                <span className="suggestion-value">{s.display}</span>
                {s.description && (
                  <span className="suggestion-description">
                    {s.description}
                  </span>
                )}
              </span>
              {s.type === 'operator' && (
                <span className="suggestion-hint">Tab to insert</span>
              )}
            </button>
          ))}

          <div className="suggestions-footer">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> to navigate
            </span>
            <span>
              <kbd>Tab</kbd> or <kbd>Enter</kbd> to select
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBox;
