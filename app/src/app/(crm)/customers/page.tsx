"use client";

import { useState } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { useListQueryState } from "@/hooks/useListQueryState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { ColumnManagerPanel } from "@/components/ui/ColumnManagerPanel";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { CustomerModal } from "@/components/customer/CustomerModal";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useColumnManager } from "@/hooks/useColumnManager";
import type { ColumnConfig } from "@/hooks/useColumnManager";
import { useAuth } from "@/providers/auth-provider";
import type { Customer } from "@/lib/api/customer-api";
import { fetchAndDownloadCsv } from "@/lib/crm-calculations";
import { toast } from "sonner";

const CUSTOMERS_COLUMNS: ColumnConfig[] = [
  { key: "name", label: "Name" },
  { key: "mobile", label: "Mobile" },
  { key: "email", label: "Email" },
  { key: "location", label: "Location" },
  { key: "kycStatus", label: "KYC Status" },
  { key: "source", label: "Source" },
  { key: "created", label: "Created" },
  { key: "actions", label: "Actions", alwaysVisible: true },
];

function renderCustomerCell(
  col: ColumnConfig,
  customer: Customer,
  onEdit: (c: Customer) => void,
): React.ReactNode {
  switch (col.key) {
    case "name":
      return <td key={col.key}><strong>{customer.name}</strong></td>;
    case "mobile":
      return <td key={col.key}>{customer.mobile}</td>;
    case "email":
      return <td key={col.key}>{customer.email || "–"}</td>;
    case "location":
      return (
        <td key={col.key}>
          {customer.cityName ? `${customer.cityName}, ${customer.stateName}` : "–"}
        </td>
      );
    case "kycStatus":
      return (
        <td key={col.key}>
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
      );
    case "source":
      return <td key={col.key}>{customer.source || "–"}</td>;
    case "created":
      return <td key={col.key}>{new Date(customer.createdAt).toLocaleDateString()}</td>;
    case "actions":
      return (
        <td key={col.key} className="actions-cell">
          <button
            type="button"
            className="icon-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(customer);
            }}
            title="Edit customer"
            aria-label="Edit customer"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            <span>Edit</span>
          </button>
        </td>
      );
    default:
      return <td key={col.key} />;
  }
}

export default function CustomersPage(): React.ReactElement {
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
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await fetchAndDownloadCsv("/api/customers/export", "customers.csv", apiParams);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const colManager = useColumnManager("customers", CUSTOMERS_COLUMNS);
  const { visibleColumns } = colManager;

  return (
    <>
      <div className="list-page">
        <PageHeader
          title="Customers"
          subtitle="Manage customer information and KYC status"
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" onClick={handleExport} disabled={exporting}>
                {exporting ? "Exporting…" : "Export CSV"}
              </Button>
              <Button onClick={() => { setEditCustomer(null); setModalOpen(true); }}>
                + New Customer
              </Button>
            </div>
          }
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
            <div className="col-mgr-toolbar">
              <ColumnManagerPanel manager={colManager} />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {visibleColumns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length} className="empty">
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id}>
                        {visibleColumns.map((col) =>
                          renderCustomerCell(col, customer, (c) => {
                            setEditCustomer(c);
                            setModalOpen(true);
                          }),
                        )}
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

      <CustomerModal
        open={modalOpen}
        customer={editCustomer}
        prefillName={editCustomer ? undefined : search}
        onClose={() => {
          setModalOpen(false);
          setEditCustomer(null);
        }}
      />
    </>
  );
}
