'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { findRecipesByQuery } from '@/lib/recipes';

const DEBOUNCE_MS = 200;
const SUGGESTIONS_LIMIT = 8;
const CACHE_TTL = 5 * 60 * 1000;

interface HistorySuggestion {
  name: string;
  frequency?: number;
  last_purchase: string;
  source?: 'history';
}

interface RecipeSuggestion {
  name: string;
  last_used: string;
  source: 'recipe';
  recipeName?: string;
}

type Suggestion = HistorySuggestion | RecipeSuggestion;

interface ItemSuggestionsProps {
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (name: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
}

interface CacheEntry {
  data: Suggestion[];
  timestamp: number;
}

export function ItemSuggestions({
  value,
  onValueChange,
  onSelect,
  id = 'item-name',
  placeholder,
  required,
}: ItemSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const closeListbox = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const getCached = useCallback((key: string): Suggestion[] | undefined => {
    const entry = cacheRef.current.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cacheRef.current.delete(key);
      return undefined;
    }
    return entry.data;
  }, []);

  const setCache = useCallback((key: string, data: Suggestion[]) => {
    cacheRef.current.set(key, { data, timestamp: Date.now() });
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    const seq = ++requestSeqRef.current;
    const trimmed = query.trim();
    const cacheKey = trimmed || '__recent__';

    const cached = getCached(cacheKey);
    if (cached) {
      if (seq !== requestSeqRef.current) return;
      let next = cached;
      if (trimmed) {
        try {
          const recipeParams = new URLSearchParams({ q: trimmed });
          const recipeResponse = await fetch(`/api/recipes/suggestions?${recipeParams.toString()}`);
          if (seq === requestSeqRef.current && recipeResponse.ok) {
            const recipeData: { suggestions?: Array<{ name: string }> } = await recipeResponse.json();
            if (Array.isArray(recipeData.suggestions)) {
              const recipeSuggestions: RecipeSuggestion[] = recipeData.suggestions.map((r) => ({
                name: r.name,
                last_used: '',
                source: 'recipe',
              }));
              next = [...recipeSuggestions, ...next];
            }
          }
        } catch {
          // silencioso
        }
      }
      next = next.slice(0, SUGGESTIONS_LIMIT);
      if (seq === requestSeqRef.current) {
        setSuggestions(next);
        if (document.activeElement === inputRef.current) {
          setIsOpen(next.length > 0 || trimmed.length > 0);
          setActiveIndex(-1);
        }
      }
      return;
    }

    try {
      const params = new URLSearchParams({ limit: String(SUGGESTIONS_LIMIT) });
      if (trimmed) params.set('q', trimmed);

      const response = await fetch(`/api/suggestions?${params.toString()}`);
      if (seq !== requestSeqRef.current) return;

      if (!response.ok) {
        if (seq === requestSeqRef.current) {
          setSuggestions([]);
          setIsOpen(false);
        }
        return;
      }

      const data: { suggestions?: Suggestion[] } = await response.json();
      if (seq !== requestSeqRef.current) return;

      let next: Suggestion[] = Array.isArray(data.suggestions) ? data.suggestions : [];
      setCache(cacheKey, next);

      if (trimmed) {
        try {
          const recipeParams = new URLSearchParams({ q: trimmed });
          const recipeResponse = await fetch(`/api/recipes/suggestions?${recipeParams.toString()}`);
          if (seq === requestSeqRef.current && recipeResponse.ok) {
            const recipeData: { suggestions?: Array<{ name: string }> } = await recipeResponse.json();
            if (Array.isArray(recipeData.suggestions)) {
              const recipeSuggestions: RecipeSuggestion[] = recipeData.suggestions.map((r) => ({
                name: r.name,
                last_used: '',
                source: 'recipe',
              }));
              next = [...recipeSuggestions, ...next];
            }
          }
        } catch {
          // silencioso
        }
      }

      next = next.slice(0, SUGGESTIONS_LIMIT);

      if (seq === requestSeqRef.current) {
        setSuggestions(next);
        if (document.activeElement === inputRef.current) {
          setIsOpen(next.length > 0 || trimmed.length > 0);
          setActiveIndex(-1);
        }
      }
    } catch {
      if (seq === requestSeqRef.current) {
        setSuggestions([]);
        setIsOpen(false);
      }
    }
  }, [getCached, setCache]);

  const scheduleFetch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchSuggestions(query);
      }, DEBOUNCE_MS);
    },
    [fetchSuggestions],
  );

  const selectSuggestion = useCallback(
    (name: string) => {
      onSelect(name);
      closeListbox();
    },
    [onSelect, closeListbox],
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeListbox();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [closeListbox]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleFocus = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void fetchSuggestions(value);
  }, [fetchSuggestions, value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange(e.target.value);
      scheduleFetch(e.target.value);
    },
    [onValueChange, scheduleFetch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
          if (activeIndex >= 0 && suggestions[activeIndex]) {
            e.preventDefault();
            selectSuggestion(suggestions[activeIndex].name);
          } else {
            closeListbox();
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeListbox();
          break;
        case 'Tab':
          closeListbox();
          break;
        default:
          break;
      }
    },
    [isOpen, suggestions, activeIndex, selectSuggestion, closeListbox],
  );

  const hasOptions = isOpen && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative min-w-0">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-[var(--app-border)] rounded-lg text-base
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   placeholder:text-gray-400"
        required={required}
        aria-required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={hasOptions ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          hasOptions && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
      />

      {isOpen &&
        (hasOptions ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Sugestões de itens"
            className="absolute left-0 right-0 top-full mt-1 z-20 bg-[var(--app-surface)] border border-[var(--app-border)]
                       rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  key={`${suggestion.source ?? 'history'}-${suggestion.name}-${index}`}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(suggestion.name)}
                  className={`cursor-pointer px-4 py-3 text-base break-words ${
                    isActive ? 'bg-blue-50 text-[var(--app-accent)]' : 'text-[var(--app-text)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {suggestion.source === 'recipe' && (
                      <span aria-hidden="true" className="text-sm">🍳</span>
                    )}
                    <span className="flex-1 min-w-0">{suggestion.name}</span>
                    {suggestion.source === 'recipe' && suggestion.recipeName && (
                      <span className="text-xs text-gray-400 truncate">
                        {suggestion.recipeName}
                      </span>
                    )}
                    {suggestion.source !== 'recipe' && suggestion.frequency != null && (
                      <span className="text-xs text-gray-400">
                        {suggestion.frequency}x
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-[var(--app-surface)] border border-[var(--app-border)]
                          rounded-lg shadow-lg px-4 py-3 text-base text-gray-500">
            Nenhuma sugestão encontrada
          </div>
        ))}

      <p className="sr-only" role="status">
        {hasOptions
          ? `${suggestions.length} ${suggestions.length === 1 ? 'sugestão' : 'sugestões'} disponíveis.${
              activeIndex >= 0 && suggestions[activeIndex]
                ? ` Opção ${activeIndex + 1} de ${suggestions.length}: ${suggestions[activeIndex].name}.`
                : ''
            }`
          : ''}
      </p>
    </div>
  );
}
