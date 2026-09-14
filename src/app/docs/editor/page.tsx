import Link from 'next/link'
import type { Metadata } from 'next'

import {
  C,
  Callout,
  DocsSection,
  DocsTable,
  DocsTitle,
  Snippet,
} from '@/components/docs/docs-parts'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { PRIMITIVE_COUNT } from '@/lib/primitives/primitive-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'
import { absoluteUrl } from '@/lib/site'

const TITLE = 'Editor extension — Hoverlab Docs'
const DESCRIPTION =
  'Search, preview and install the Hoverlab catalog from inside VS Code, Cursor or Windsurf — and hand the whole catalog to your agent with nothing to configure.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/docs/editor' },
  openGraph: {
    url: absoluteUrl('/docs/editor'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function EditorDocsPage() {
  return (
    <>
      <DocsTitle
        eyebrow="Editor"
        title="The catalog, in your editor"
        intro={
          <>
            A sidebar over all five tiers, one search across them, the real
            component previewed beside your code, and install into the project
            you are standing in. Plus the{' '}
            <Link href="/mcp" className="text-primary underline underline-offset-4">
              MCP server
            </Link>{' '}
            registered for you, which is the part that saves a config file.
          </>
        }
      />

      <DocsSection id="why" title="Why this exists">
        <p>
          Everything else the catalog ships starts by leaving the editor. The{' '}
          <Link href="/docs/cli" className="text-primary underline underline-offset-4">
            CLI
          </Link>{' '}
          is a terminal, the{' '}
          <Link href="/docs/api" className="text-primary underline underline-offset-4">
            API
          </Link>{' '}
          is a fetch, the{' '}
          <Link href="/docs/registry" className="text-primary underline underline-offset-4">
            registry
          </Link>{' '}
          is a command you have to know exists, and browsing is a browser. That
          is three surfaces and a website, none of which are where the work
          happens.
        </p>
        <p>
          This one is. It reads the same public API, installs with the same
          writer the CLI uses, and previews by framing the same chrome-less
          render the detail pages use for their width control — so nothing here
          is a second implementation that can disagree with the first.
        </p>
      </DocsSection>

      <DocsSection id="install" title="Installing it">
        <p>
          It works in VS Code, Cursor and Windsurf. It is not on the
          Marketplace yet, so it installs from a checkout — either as a
          development host, or as a real <C>.vsix</C> you keep:
        </p>
        <Snippet label="terminal">{`git clone https://github.com/Vijetbhat6/hoverlab
cd hoverlab/packages/vscode
npm install

# either: run it in a development host
code .            # then F5

# or: build a .vsix and install it for good
npm pack ../cli --pack-destination .
npm install ./hoverlab-0.3.0.tgz
npx @vscode/vsce package
code --install-extension hoverlab-vscode-0.1.0.vsix`}</Snippet>
        <p>
          The <C>npm pack</C> step is there because the extension&rsquo;s one
          runtime dependency is the CLI package in the same repository. A{' '}
          <C>file:</C> dependency installs as a symlink and <C>vsce</C> would
          package the link instead of the files, producing an extension that
          loads and then fails on its first command. Packing it first is the
          same shape npm will serve once the CLI is published, at which point
          the step disappears.
        </p>
        <Callout>
          The extension is plain CommonJS with no bundler and no compile step.
          An extension asks for write access to your repository, and every line
          that ships should be readable without running a build first.
        </Callout>
      </DocsSection>

      <DocsSection id="what-it-does" title="What it does">
        <DocsTable
          head={['Part', 'What you get']}
          rows={[
            [
              'Sidebar',
              <>
                All five tiers — effects, {PRIMITIVE_COUNT} primitives,{' '}
                {BLOCK_COUNT} blocks, {PAGE_COUNT} pages, {TEMPLATE_COUNT}{' '}
                templates — grouped by category, with the id on every row
              </>,
            ],
            [
              'Search',
              <>
                One palette command across all five at once. Results come from
                the server, so they match on tags and descriptions the row does
                not show
              </>,
            ],
            [
              'Preview',
              <>
                The actual component in a tab beside your code, framed from{' '}
                <C>/preview/{'{level}'}/{'{id}'}</C> — not a re-rendered copy
                that can drift from the source you are about to paste
              </>,
            ],
            [
              'Install',
              <>
                Runs the same writer as <C>npx hoverlab add</C>: a page brings
                the blocks it imports, and an existing file is never
                overwritten without being named first
              </>,
            ],
            [
              'MCP',
              <>
                The server contributed to agent mode, so there is no JSON file
                to find and edit. See <a href="#mcp" className="text-primary underline underline-offset-4">below</a>
              </>,
            ],
          ]}
        />
      </DocsSection>

      <DocsSection id="mcp" title="The part worth installing it for">
        <p>
          The MCP server has existed for a while, and using it meant
          hand-editing a config file in a location that differs per editor.
          That step is where most people who would have used it stopped.
        </p>
        <p>
          VS Code lets an extension <em>contribute</em> an MCP server. So
          installing this one is configuring it: agent mode gets{' '}
          <C>search_catalog</C>, <C>install_artifact</C>, <C>get_kit</C>,{' '}
          <C>match_design</C>, <C>init_template</C> and <C>get_design_dna</C>{' '}
          over all five tiers, with nothing typed. It runs{' '}
          <C>npx -y hoverlab mcp</C> on demand rather than bundling a copy,
          because the tool definitions teach an agent what the catalog can do
          and a frozen copy would teach it last quarter&rsquo;s answer.
        </p>
        <Callout>
          The API this uses is recent, and Cursor and Windsurf track upstream
          VS Code on their own schedule. Where it is missing the extension
          detects that and everything else still works — and the server can
          always be added by hand with <C>npx -y hoverlab mcp</C>, which is
          what <Link href="/mcp" className="text-primary underline underline-offset-4">the MCP page</Link>{' '}
          documents.
        </Callout>
      </DocsSection>

      <DocsSection id="settings" title="Settings">
        <DocsTable
          head={['Setting', 'Default', 'What it is for']}
          rows={[
            [
              <C key="a">hoverlab.apiUrl</C>,
              'empty',
              <>
                Read the catalog from a preview deployment or{' '}
                <C>http://localhost:3000</C>. Needs a window reload — the
                origin is resolved once, when the catalog module first loads
              </>,
            ],
            [
              <C key="f">hoverlab.framework</C>,
              <C key="fd">auto</C>,
              <>
                Output target for <em>effects</em>. <C>auto</C> reads it off
                your dependencies, so a Vue app gets an SFC. Primitives, blocks
                and pages are React and ignore it
              </>,
            ],
            [
              <C key="m">hoverlab.registerMcpServer</C>,
              'true',
              'Offer the MCP server to agent mode',
            ],
          ]}
        />
      </DocsSection>

      <DocsSection id="limits" title="What it does not do">
        <p>
          <strong>No account and no wall.</strong> The catalog is readable
          without a key and the extension does not change that. The licence
          commands exist because the Pro templates need one, and they write to
          the same <C>~/.hoverlab/config.json</C> the CLI reads — one
          credential, whichever surface set it, so signing in once covers both.
        </p>
        <p>
          <strong>Installing needs a workspace on disk.</strong> It writes
          through the filesystem, by way of the CLI&rsquo;s own writer.
          Browsing and previewing work in a remote or virtual workspace;
          installing does not.
        </p>
        <p>
          <strong>There is no builder inside it.</strong>{' '}
          <Link href="/builder" className="text-primary underline underline-offset-4">
            /builder
          </Link>{' '}
          composes blocks into a page by dragging them around a canvas that
          renders every one of them live, and the composition is a shareable
          URL. A webview reimplementation would be a worse copy of something
          one click away, so the command opens the real one.
        </p>
      </DocsSection>
    </>
  )
}
