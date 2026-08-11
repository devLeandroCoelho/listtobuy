'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * ItemSuggestions — Autocomplete de nomes de itens já usados pelo usuário.
 *
 * Busca sugestões em GET /api/items/suggestions (histórico do usuário, ordenado
 * por uso recente, máx 8) com debounce de 200ms e exibe um dropdown logo abaixo
 * do campo. Se o campo estiver vazio ao focar, mostra os itens mais recentes.
 *
 * Funcionalidades:
 * - Debounce de 200ms na digitação
 * - Ao focar com o campo vazio, busca os itens mais recentes
 * - Seleção por clique ou teclado (setas ↑/↓ + Enter)
 * - Esc fecha o dropdown; clicar fora também fecha
 * - Erros de API são tratados silenciosamente (só não mostra sugestões)
 * - Selecionar sugestão NÃO submete o formulário — apenas preenche o campo
 *
 * Acessibilidade (WCAG 2.1 AA):
 * - role="combobox" + aria-expanded no input
 * - listbox/option com aria-activedescendant para a opção ativa
 * - Navegação completa por teclado (setas, Enter, Esc, Tab)
 * - Região ao vivo (role="status") anunciando sugestões e opção ativa
 * - Contraste mínimo 4.5:1, fonte 16px, sem animações piscantes
 */

/** Debounce da busca de sugestões (ms) */
const DEBOUNCE_MS = 200;

/** Máximo de sugestões solicitadas à API */
const SUGGESTIONS_LIMIT = 8;

interface Suggestion {
  name: string;
  last_used: string;
}

interface ItemSuggestionsProps {
  /** Valor atual do campo (controlado pela página) */
  value: string;
  /** Chamado quando o usuário digita — a página mantém o estado */
  onValueChange: (value: string) => void;
  /** Chamado quando o usuário seleciona uma sugestão */
  onSelect: (name: string) => void;
  /** id do input (para o label da página via htmlFor) */
  id?: string;
  placeholder?: string;
  required?: boolean;
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

  const closeListbox = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  /** Busca sugestões na API (descarta respostas atrasadas/obsoletas) */
  const fetchSuggestions = useCallback(async (query: string) => {
    const seq = ++requestSeqRef.current;
    const trimmed = query.trim();

    try {
      const params = new URLSearchParams({ limit: String(SUGGESTIONS_LIMIT) });
      if (trimmed) params.set('q', trimmed);

      const response = await fetch(`/api/items/suggestions?${params.toString()}`);
      if (seq !== requestSeqRef.current) return; // resposta antiga — ignora

      if (!response.ok) {
        // Erro silencioso (ex.: sessão expirada) — apenas não mostra sugestões
        if (seq === requestSeqRef.current) {
          setSuggestions([]);
          setIsOpen(false);
        }
        return;
      }

      const data: { suggestions?: Suggestion[] } = await response.json();
      if (seq !== requestSeqRef.current) return;

      const next = Array.isArray(data.suggestions) ? data.suggestions : [];
      setSuggestions(next);

      // Abre o dropdown só se o input ainda estiver focado. Com termo digitado
      // e zero resultados, abre para exibir "nenhuma sugestão".
      if (document.activeElement === inputRef.current) {
        setIsOpen(next.length > 0 || trimmed.length > 0);
        setActiveIndex(-1);
      }
    } catch {
      // Falha de rede/parse — silencioso
      if (seq === requestSeqRef.current) {
        setSuggestions([]);
        setIsOpen(false);
      }
    }
  }, []);

  /** Agenda busca com debounce após digitar */
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
      onSelect(name); // apenas preenche o campo — não submete o form
      closeListbox();
    },
    [onSelect, closeListbox],
  );

  // Fecha o dropdown ao clicar/toque fora do componente
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

  // Limpa o debounce pendente ao desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /** Ao focar, busca imediatamente (sem debounce) — mostra itens recentes */
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
            // Sem opção ativa: fecha o dropdown e deixa o submit do form seguir
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
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base
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
            className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-300
                       rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  key={suggestion.name}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => e.preventDefault()} // mantém o foco no input
                  onClick={() => selectSuggestion(suggestion.name)}
                  className={`cursor-pointer px-4 py-3 text-base ${
                    isActive ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                  }`}
                >
                  {suggestion.name}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-300
                          rounded-lg shadow-lg px-4 py-3 text-base text-gray-500">
            Nenhuma sugestão encontrada
          </div>
        ))}

      {/* Região ao vivo para leitores de tela */}
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
