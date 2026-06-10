"use client";

import { useState } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { useListQueryState } from "@/hooks/useListQueryState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { CustomerModal } from "@/components/customer/CustomerModal";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useAuth } from "@/providers/auth-provider";
import type { Customer } from "@/lib/api/customer-api";

export default function CustomersPage() {
  const { user } = useAuth();
  const role = user?.role ?? "POSP";

  const {
    filters,
    query,
    search,
    resetFilters,
    removeFilterChip,
    setSearch,
    setPage,
    setPageSize,
    applyViewFilters,
    apiParams,
  } = useListQueryState(undefined, "customers");

  const customersQuery = useCustomers(apiParams);
  const { data: result } = customersQuery;
  const { isInitialLoading, isRefreshing } = useListQueryStatus(customersQuery);
  const customers = result?.data ?? [];
  const meta = result?.meta;

  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  return (
    <>
      <div className="list-page">
      <PageHeader
        title="Customers"
        subtitle="Manage customer information and KYC status"
        actions={<Button onClick={() => { setEditCustomer(null); setModalOpen(true); }}>+ New Customer</Button>}
      />

      <UniversalFilter
        view="customers"
        role={role}
        query={query}
        filters={filters}
        applyViewFilters={applyViewFilters}
        onRemoveChip={removeFilterChip}
        onReset={resetFilters}
        search={search}
        onSearchChange={setSearch}
      />

      <Card className="list-table-card">
        <ListDataSection isInitialLoading={isInitialLoading} isRefreshing={isRefreshing} stretch>
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
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">No customers found</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td><strong>{customer.name}</strong></td>
                    <td>{customer.mobile}</td>
                    <td>{customer.email || "–"}</td>
                    <td>
                      {customer.cityName ? `${customer.cityName}, ${customer.stateName}` : "–"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          customer.kycStatus === "VERIFIED"
                            ? "badge-success"
                            : customer.kycStatus === "REJECTED"
                              ? "badge-danger"
                              : "badge-warning"
                        }`}
                      >
                        {customer.kycStatus}
                      </span>
                    </td>
                    <td>{customer.source || "–"}</td>
                    <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button type="button" className="icon-btn" onClick={() => { setEditCustomer(customer); setModalOpen(true); }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          {meta ? (
            <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} />
          ) : null}
        </ListDataSection>
      </Card>
      </div>

      <CustomerModal open={modalOpen} customer={editCustomer} onClose={() => setModalOpen(false)} />
    </>
  );
}
