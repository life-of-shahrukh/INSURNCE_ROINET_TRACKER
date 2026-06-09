"use client";

import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { CustomerModal } from '@/components/customer/CustomerModal';
import type { Customer } from '@/lib/api/customer-api';

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers?.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.mobile.includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  });

  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditCustomer(null);
    setModalOpen(true);
  };

  if (isLoading) return <div className="empty">Loading customers...</div>;

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Manage customer information and KYC status"
        actions={
          <Button onClick={handleCreate}>
            + New Customer
          </Button>
        }
      />

      <Card>
        <div className="filter-bar">
          <input
            className="search-input"
            type="text"
            placeholder="Search by name, mobile, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Location</th>
                <th>KYC Status</th>
                <th>Source</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!filteredCustomers || filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.name}</strong>
                    </td>
                    <td>{customer.mobile}</td>
                    <td>{customer.email || '–'}</td>
                    <td>
                      {customer.cityName ? (
                        <span>
                          {customer.cityName}, {customer.stateName}
                        </span>
                      ) : (
                        '–'
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          customer.kycStatus === 'VERIFIED'
                            ? 'badge-success'
                            : customer.kycStatus === 'REJECTED'
                              ? 'badge-danger'
                              : 'badge-warning'
                        }`}
                      >
                        {customer.kycStatus}
                      </span>
                    </td>
                    <td>{customer.source || '–'}</td>
                    <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => handleEdit(customer)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CustomerModal
        open={modalOpen}
        customer={editCustomer}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
