'use client'

/**
 * <ApiEndpointCard> — one REST endpoint, documented on a single card.
 *
 * Request and response sit side by side because an example request whose
 * response is a scroll away gets pasted blind: the reader copies the curl,
 * runs it, and only then discovers what shape came back. Keeping the pair
 * in one glance is the whole reference — the prose is commentary.
 *
 * The parameters live in a real <table>, not a definition list styled to
 * look like one, because required-versus-optional is a column you scan
 * down, and screen readers get the same scan for free.
 */

import * as React from 'react'
import { Copy, Check } from 'lucide-react'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface EndpointParameter {
  name: string
  type: string
  required: boolean
  description: string
}

export interface ApiEndpointCardProps {
  method?: HttpMethod
  path?: string
  description?: string
  parameters?: EndpointParameter[]
  requestExample?: string
  responseExample?: string
  responseStatus?: string
  className?: string
}

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/15 text-emerald-500',
  POST: 'bg-sky-500/15 text-sky-500',
  PUT: 'bg-amber-500/15 text-amber-500',
  PATCH: 'bg-amber-500/15 text-amber-500',
  DELETE: 'bg-rose-500/15 text-rose-500',
}

const DEFAULT_PARAMETERS: EndpointParameter[] = [
  {
    name: 'project_id',
    type: 'string',
    required: true,
    description: 'The project to list deployments for. Passed in the path.',
  },
  {
    name: 'status',
    type: 'string',
    required: false,
    description: 'Filter by state: building, ready or failed.',
  },
  {
    name: 'limit',
    type: 'integer',
    required: false,
    description: 'Page size, 1–100. Defaults to 20.',
  },
  {
    name: 'cursor',
    type: 'string',
    required: false,
    description: 'Opaque cursor from a previous page’s next_cursor.',
  },
]

const DEFAULT_REQUEST = `curl "https://api.acme.dev/v1/projects/prj_8kq2/deployments?limit=2" \\
  -H "Authorization: Bearer $ACME_API_KEY"`

const DEFAULT_RESPONSE = `{
  "data": [
    {
      "id": "dep_9f2c1a",
      "status": "ready",
      "branch": "main",
      "created_at": "2026-08-12T09:41:00Z"
    },
    {
      "id": "dep_8e1b0d",
      "status": "failed",
      "branch": "fix/session-ttl",
      "created_at": "2026-08-11T17:03:12Z"
    }
  ],
  "next_cursor": "dep_7d0a9c"
}`

/** Split "/v1/projects/{project_id}/…" so the placeholders read as placeholders. */
function renderPath(path: string) {
  return path.split(/(\{[^}]+\})/).map((segment, i) =>
    segment.startsWith('{') ? (
      <span key={i} className="text-amber-500">
        {segment}
      </span>
    ) : (
      <span key={i}>{segment}</span>
    ),
  )
}

export function ApiEndpointCard({
  method = 'GET',
  path = '/v1/projects/{project_id}/deployments',
  description = 'List the deployments for a project, newest first.',
  parameters = DEFAULT_PARAMETERS,
  requestExample = DEFAULT_REQUEST,
  responseExample = DEFAULT_RESPONSE,
  responseStatus = '200 OK',
  className = '',
}: ApiEndpointCardProps) {
  const [copied, setCopied] = React.useState(false)

  function copyPath() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    void navigator.clipboard.writeText(path).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <section
      className={`w-full rounded-2xl border border-border/60 bg-card/60 p-6 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-md px-2 py-1 font-mono text-xs font-bold ${METHOD_STYLES[method]}`}
        >
          {method}
        </span>
        <code className="min-w-0 truncate font-mono text-sm text-foreground">
          {renderPath(path)}
        </code>
        <button
          type="button"
          onClick={copyPath}
          aria-label="Copy endpoint path"
          className="inline-flex items-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? (
            <Check aria-hidden className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy aria-hidden className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <h3 className="mt-6 text-sm font-semibold tracking-tight">Parameters</h3>
      <div className="mt-2 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/50">
              <th scope="col" className="px-4 py-2.5 font-medium">
                Name
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Type
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Required
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((param) => (
              <tr key={param.name} className="border-b border-border/60 last:border-b-0">
                <td className="px-4 py-2.5 font-mono text-xs">{param.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                  {param.type}
                </td>
                <td className="px-4 py-2.5">
                  {param.required ? (
                    <span className="text-xs font-medium text-amber-500">Required</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Optional</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{param.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-zinc-950">
          <div className="flex items-center border-b border-white/10 px-4 py-2.5">
            <span className="font-mono text-xs text-white/40">Request</span>
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
            <code className="font-mono text-zinc-300">{requestExample}</code>
          </pre>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="font-mono text-xs text-white/40">Response</span>
            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-xs font-medium text-emerald-400">
              {responseStatus}
            </span>
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
            <code className="font-mono text-zinc-300">{responseExample}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}
