"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { useState } from "react";

const BASE_URL = "uatserviceapi.roinet.in";

interface RequestField {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: string;
}

interface ResponseField {
  name: string;
  type: string;
  description: string;
  example: string;
}

interface ApiEndpoint {
  id: string;
  method: "POST";
  path: string;
  summary: string;
  description: string;
  requestBody: RequestField[] | null;
  requestNote: string | null;
  responseFields: ResponseField[];
  responseSample: object;
  curlExample: string;
  tag: string;
  tagColor: string;
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    id: "list-state",
    method: "POST",
    path: "/Cognitensor/ListState",
    summary: "List States",
    description:
      "Retrieves the master list of all states. No request body is required — send an empty POST.",
    requestBody: null,
    requestNote: "No request body required. Send an empty POST.",
    responseFields: [
      { name: "stateid", type: "string", description: "Unique identifier for the state", example: "2" },
      { name: "statename", type: "string", description: "Display name of the state", example: "Maharashtra" },
      { name: "status", type: "string", description: "Active / Inactive flag", example: "Active" },
    ],
    responseSample: {
      status: "success",
      data: [
        { stateid: "1", statename: "Andhra Pradesh", status: "Active" },
        { stateid: "2", statename: "Maharashtra", status: "Active" },
        { stateid: "3", statename: "Karnataka", status: "Active" },
      ],
    },
    curlExample: `curl --location --request POST 'uatserviceapi.roinet.in/Cognitensor/ListState' \\
--data ''`,
    tag: "Location",
    tagColor: "cold",
  },
  {
    id: "list-district",
    method: "POST",
    path: "/Cognitensor/ListDistrict",
    summary: "List Districts",
    description:
      "Returns all districts that belong to the given state. Use the stateid from List States as input.",
    requestBody: [
      { name: "stateid", type: "string", required: true, description: "ID of the parent state", example: "2" },
    ],
    requestNote: null,
    responseFields: [
      { name: "districtid", type: "string", description: "Unique identifier for the district", example: "387" },
      { name: "districtname", type: "string", description: "Display name of the district", example: "Pune" },
      { name: "stateid", type: "string", description: "Parent state ID", example: "2" },
      { name: "status", type: "string", description: "Active / Inactive flag", example: "Active" },
    ],
    responseSample: {
      status: "success",
      data: [
        { districtid: "385", districtname: "Mumbai", stateid: "2", status: "Active" },
        { districtid: "387", districtname: "Pune", stateid: "2", status: "Active" },
        { districtid: "390", districtname: "Nagpur", stateid: "2", status: "Active" },
      ],
    },
    curlExample: `curl --location 'uatserviceapi.roinet.in/Cognitensor/ListDistrict' \\
--header 'Content-Type: application/json' \\
--data '{
    "stateid":"2"
}'`,
    tag: "Location",
    tagColor: "cold",
  },
  {
    id: "list-city",
    method: "POST",
    path: "/Cognitensor/ListCity",
    summary: "List Cities",
    description:
      "Returns all cities within a district. Use the districtid from List Districts as input.",
    requestBody: [
      { name: "districtid", type: "string", required: true, description: "ID of the parent district", example: "387" },
    ],
    requestNote: null,
    responseFields: [
      { name: "cityid", type: "string", description: "Unique identifier for the city", example: "1024" },
      { name: "cityname", type: "string", description: "Display name of the city", example: "Pune City" },
      { name: "districtid", type: "string", description: "Parent district ID", example: "387" },
      { name: "status", type: "string", description: "Active / Inactive flag", example: "Active" },
    ],
    responseSample: {
      status: "success",
      data: [
        { cityid: "1024", cityname: "Pune City", districtid: "387", status: "Active" },
        { cityid: "1025", cityname: "Pimpri-Chinchwad", districtid: "387", status: "Active" },
      ],
    },
    curlExample: `curl --location 'uatserviceapi.roinet.in/Cognitensor/ListCity' \\
--header 'Content-Type: application/json' \\
--data '{
    "districtid":"387"
}'`,
    tag: "Location",
    tagColor: "cold",
  },
  {
    id: "list-hierarchy",
    method: "POST",
    path: "/Cognitensor/ListHierarchyUserData",
    summary: "List Hierarchy User Data",
    description:
      "Retrieves the full organizational user hierarchy tree. No request body required.",
    requestBody: null,
    requestNote: "No request body required. Send an empty POST.",
    responseFields: [
      { name: "userid", type: "string", description: "Unique identifier for the user", example: "1001" },
      { name: "username", type: "string", description: "Full name of the user", example: "Rajesh Kumar" },
      { name: "role", type: "string", description: "Role in hierarchy (e.g. NH, RM, AM)", example: "RM" },
      { name: "parentid", type: "string", description: "Parent user ID (null for root)", example: "900" },
      { name: "level", type: "string", description: "Hierarchy depth — 1 = top-most", example: "2" },
      { name: "status", type: "string", description: "Active / Inactive flag", example: "Active" },
    ],
    responseSample: {
      status: "success",
      data: [
        { userid: "900", username: "National Head", role: "NH", parentid: null, level: "1", status: "Active" },
        { userid: "1001", username: "Rajesh Kumar", role: "RM", parentid: "900", level: "2", status: "Active" },
        { userid: "1002", username: "Priya Sharma", role: "AM", parentid: "1001", level: "3", status: "Active" },
      ],
    },
    curlExample: `curl --location --request POST 'uatserviceapi.roinet.in/Cognitensor/ListHierarchyUserData' \\
--data ''`,
    tag: "Users",
    tagColor: "warm",
  },
];

type TabKey = "request" | "response" | "curl";

function EndpointPanel({ ep }: { ep: ApiEndpoint }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("request");

  return (
    <div className={`api-endpoint ${open ? "open" : ""}`}>
      <button
        type="button"
        className="api-endpoint-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="api-method-badge">POST</span>
        <span className="api-path">{ep.path}</span>
        <span className="api-summary">{ep.summary}</span>
        <span className={`badge badge-${ep.tagColor}`} style={{ marginLeft: "auto", marginRight: 8 }}>
          {ep.tag}
        </span>
        <span className="api-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="api-endpoint-body">
          <p className="api-description">{ep.description}</p>

          <div className="api-meta-row">
            <span className="api-meta-label">Server</span>
            <code className="api-inline-code">{BASE_URL}</code>
            <span className="api-meta-label" style={{ marginLeft: 20 }}>Content-Type</span>
            <code className="api-inline-code">application/json</code>
          </div>

          <div className="api-tabs">
            {(["request", "response", "curl"] as TabKey[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`api-tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t === "request" ? "Request Body" : t === "response" ? "Response Schema" : "cURL"}
              </button>
            ))}
          </div>

          {tab === "request" && (
            <div className="api-tab-content">
              {ep.requestNote ? (
                <div className="api-no-body-note">{ep.requestNote}</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Description</th>
                        <th>Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ep.requestBody?.map((f) => (
                        <tr key={f.name}>
                          <td><code className="api-inline-code">{f.name}</code></td>
                          <td><span className="api-type">{f.type}</span></td>
                          <td>
                            <span className={`api-required-pill ${f.required ? "yes" : "no"}`}>
                              {f.required ? "required" : "optional"}
                            </span>
                          </td>
                          <td>{f.description}</td>
                          <td><code className="api-inline-code">{f.example}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "response" && (
            <div className="api-tab-content">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ep.responseFields.map((f) => (
                      <tr key={f.name}>
                        <td><code className="api-inline-code">{f.name}</code></td>
                        <td><span className="api-type">{f.type}</span></td>
                        <td>{f.description}</td>
                        <td><code className="api-inline-code">{f.example}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="api-sample-label">Sample Response</div>
              <pre className="api-code-block">{JSON.stringify(ep.responseSample, null, 2)}</pre>
            </div>
          )}

          {tab === "curl" && (
            <div className="api-tab-content">
              <pre className="api-code-block">{ep.curlExample}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApiReferencePage() {
  const locationEndpoints = ENDPOINTS.filter((e) => e.tag === "Location");
  const userEndpoints = ENDPOINTS.filter((e) => e.tag === "Users");

  return (
    <>
      <PageHeader
        title="API Reference"
        subtitle="Roinet Cognitensor — UAT environment endpoints"
      />

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Endpoints</div>
          <div className="kpi-value">4</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">HTTP Method</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>POST</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Format</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>JSON</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Environment</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>UAT</div>
        </div>
      </div>

      <Card>
        <div className="api-info-row">
          <span className="api-meta-label">Base URL</span>
          <code className="api-inline-code api-base-url">{BASE_URL}</code>
          <span className="api-env-badge">UAT</span>
        </div>
        <p className="api-description" style={{ marginTop: 10 }}>
          No authentication headers were observed in the provided cURL examples. Confirm with the
          Roinet team whether a token or API key is required before production use.
        </p>
      </Card>

      <div className="api-section-heading">Location Hierarchy</div>
      <p className="api-section-sub">
        Call these three endpoints in sequence — State → District → City — to build cascading location selectors.
      </p>
      <div className="api-flow-strip">
        <span className="api-flow-step">1. ListState</span>
        <span className="api-flow-arrow">→</span>
        <span className="api-flow-step">2. ListDistrict (stateid)</span>
        <span className="api-flow-arrow">→</span>
        <span className="api-flow-step">3. ListCity (districtid)</span>
      </div>
      <div className="api-endpoints-group">
        {locationEndpoints.map((ep) => (
          <EndpointPanel key={ep.id} ep={ep} />
        ))}
      </div>

      <div className="api-section-heading" style={{ marginTop: 32 }}>User Hierarchy</div>
      <p className="api-section-sub">
        Returns the full organizational user tree. No input required.
      </p>
      <div className="api-endpoints-group">
        {userEndpoints.map((ep) => (
          <EndpointPanel key={ep.id} ep={ep} />
        ))}
      </div>
    </>
  );
}
