"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchCustomers } from '@/hooks/useCustomers';
import type { Customer } from '@/lib/api/customer-api';

interface CustomerSearchSelectProps {
  value: string | null;
  /** Customer name to display when there is no customerId (e.g. free-text entry). */
  displayValue?: string | null;
  onChange: (customerId: string | null, customerName: string | null) => void;
  label?: string;
  required?: boolean;
  /**
   * When true, the user can type any name freely. Every keystroke emits
   * onChange(null, typedText) so the parent always has the latest text.
   * Selecting a suggestion overrides with the real customerId.
   */
  allowFreeText?: boolean;
  /**
   * When provided, an "Add new customer" row is shown at the bottom of the
   * dropdown. Calling this callback opens the quick-add modal with the
   * current search text pre-filled as the customer name.
   */
  onAddNew?: (prefillName: string) => void;
  /**
   * Called whenever search results are loaded. Provides full Customer objects
   * so callers can build a local lookup cache.
   */
  onResultsLoaded?: (customers: Customer[]) => void;
}

export function CustomerSearchSelect({
  value,
  displayValue,
  onChange,
  label = 'Customer',
  required = false,
  allowFreeText = false,
  onAddNew,
  onResultsLoaded,
}: CustomerSearchSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading } = useSearchCustomers(
    searchQuery,
    searchQuery.length >= 2,
  );

  const selectedCustomer = searchResults?.find((c) => c.id === value);

  // Notify parent when results change so it can build a cache
  useEffect(() => {
    if (searchResults && onResultsLoaded) {
      onResultsLoaded(searchResults);
    }
  // onResultsLoaded intentionally excluded — parent ref should be stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults]);

  // Sync display text: prefer the matched customer name, fall back to displayValue.
  useEffect(() => {
    if (selectedCustomer) {
      setSearchQuery(selectedCustomer.name);
    } else if (!selectedCustomer && displayValue && !searchQuery) {
      // customerId is set but the customer isn't in the current search results yet
      // (e.g. editing a lead where the user hasn't re-searched) — show the known name
      setSearchQuery(displayValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer, value, displayValue]);

  // Close dropdown when clicking outside.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customerId: string, customerName: string) => {
    setSearchQuery(customerName);
    setShowDropdown(false);
    onChange(customerId, customerName);
  };

  const handleClear = () => {
    setSearchQuery('');
    setShowDropdown(false);
    onChange(null, null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchQuery(text);
    setShowDropdown(true);
    if (!text) {
      onChange(null, null);
    } else if (allowFreeText) {
      // Immediately emit the typed text so the parent always has the latest name.
      onChange(null, text);
    }
  };

  const isCustomerLocked = Boolean(value);
  const showClear = isCustomerLocked || (allowFreeText && searchQuery.length > 0);

  return (
    <div className={label ? 'form-group' : undefined} ref={containerRef}>
      {label && (
        <label>
          {label}
          {required && ' *'}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={
            allowFreeText
              ? 'Search by name / mobile number, or type a new name…'
              : 'Search customer by name, mobile, or email…'
          }
          required={required}
        />
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#999',
            }}
          >
            ×
          </button>
        )}

        {showDropdown && searchQuery.length >= 2 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginTop: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {isLoading ? (
              <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>
                Searching…
              </div>
            ) : (
              <>
                {(!searchResults || searchResults.length === 0) && (
                  <div style={{ padding: '8px 12px', color: '#999', fontSize: 13 }}>
                    {allowFreeText
                      ? `No match — "${searchQuery}" will be saved as a new name`
                      : 'No customers found'}
                  </div>
                )}

                {searchResults && searchResults.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleSelect(customer.id, customer.name)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: value === customer.id ? '#f0f0f0' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        value === customer.id ? '#f0f0f0' : 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{customer.name}</span>
                      {customer.clientCode && (
                        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>
                          {customer.clientCode}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {customer.mobile}
                      {customer.email && ` • ${customer.email}`}
                    </div>
                  </div>
                ))}

                {/* ── Add new customer row ── */}
                {onAddNew && (
                  <div
                    onClick={() => {
                      setShowDropdown(false);
                      onAddNew(searchQuery);
                    }}
                    style={{
                      padding: '9px 12px',
                      cursor: 'pointer',
                      borderTop: searchResults && searchResults.length > 0
                        ? '1px solid #e8f0fe'
                        : undefined,
                      background: '#f0f7ff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#1a6ed8',
                      fontWeight: 600,
                      fontSize: 13,
                      borderBottomLeftRadius: 4,
                      borderBottomRightRadius: 4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#dbeafe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f0f7ff';
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
                    <span>
                      Add{searchQuery.trim() ? ` "${searchQuery.trim()}"` : ""} as new customer
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
