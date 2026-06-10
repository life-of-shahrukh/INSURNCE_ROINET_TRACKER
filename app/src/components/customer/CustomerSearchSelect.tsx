"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchCustomers } from '@/hooks/useCustomers';

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
}

export function CustomerSearchSelect({
  value,
  displayValue,
  onChange,
  label = 'Customer',
  required = false,
  allowFreeText = false,
}: CustomerSearchSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading } = useSearchCustomers(
    searchQuery,
    searchQuery.length >= 2,
  );

  const selectedCustomer = searchResults?.find((c) => c.id === value);

  // Sync display text: prefer the matched customer name, fall back to displayValue.
  useEffect(() => {
    if (selectedCustomer) {
      setSearchQuery(selectedCustomer.name);
    } else if (!value && displayValue && !searchQuery) {
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
              ? 'Search existing or type a new name…'
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
            ) : !searchResults || searchResults.length === 0 ? (
              <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>
                {allowFreeText
                  ? `No match — "${searchQuery}" will be saved as a new customer name`
                  : 'No customers found'}
              </div>
            ) : (
              searchResults.map((customer) => (
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
                  <div style={{ fontWeight: 600 }}>{customer.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {customer.mobile}
                    {customer.email && ` • ${customer.email}`}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
