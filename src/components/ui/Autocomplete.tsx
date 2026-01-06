'use client';

import { useState, useRef, useEffect } from 'react';

export interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
  onCreateNew?: (searchTerm: string) => void;
  createNewLabel?: string;
}

export default function Autocomplete({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  className = '',
  disabled = false,
  allowClear = true,
  onCreateNew,
  createNewLabel = 'Créer...',
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filtrer les options basées sur le terme de recherche
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gérer la navigation au clavier
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (filteredOptions.length === 0 && searchTerm && onCreateNew) {
          onCreateNew(searchTerm);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions, searchTerm, onCreateNew]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : selectedOption?.label || ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          readOnly={!isOpen}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {allowClear && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                if (!isOpen) {
                  inputRef.current?.focus();
                }
              }
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
            disabled={disabled}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`px-4 py-2 cursor-pointer transition-colors text-sm ${
                    value === option.value
                      ? 'bg-blue-50 text-blue-900 font-medium'
                      : highlightedIndex === index
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          ) : searchTerm && onCreateNew ? (
            <div className="py-1">
              <div className="px-4 py-2 text-sm text-gray-500 text-center mb-1">
                Aucun résultat trouvé
              </div>
              <button
                type="button"
                onClick={() => {
                  onCreateNew(searchTerm);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2"
                onMouseEnter={() => setHighlightedIndex(-1)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {createNewLabel} "{searchTerm}"
              </button>
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              Aucun résultat trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}

