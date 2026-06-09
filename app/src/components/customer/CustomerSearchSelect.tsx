"use client";

import { useState, useEffect } from 'react';
import { useSearchCustomers } from '@/hooks/useCustomers';

interface CustomerSearchSelectProps {
  value: string | null;
  onChange: (customerId: string | null, customerName: string | null) => void;
  label?: string;
  required?: boolean;
}

export function CustomerSearchSelect({
  value,
  onChange,
  label = 'Customer',
  required = false,
}: CustomerSearchSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: searchResults, isLoading } = useSearchCustomers(
    searchQuery,
    searchQuery.length >= 2,
  );

  const selectedCustomer = searchResults?.find((c) => c.id === value);

  useEffect(() => {
    if (selectedCustomer) {
      setSearchQuery(selectedCustomer.name);
    }
  }, [selectedCustomer]);

  const handleSelect = (customerId: string, customerName: string) => {
    setSearchQuery(customerName);
    setShowDropdown(false);
    onChange(customerId, customerName);
  };

  const handleClear = () => {
    setSearchQuery('');
    onChange(null, null);
  };

  return (
    <div className="form-group">
      <label>
        {label} {required && '*'}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
            if (!e.target.value) {
              onChange(null, null);
            }
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search customer by name, mobile, or email..."
          required={required}
        />
        {value && (
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
                Searching...
              </div>
            ) : !searchResults || searchResults.length === 0 ? (
              <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>
                No customers found
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
