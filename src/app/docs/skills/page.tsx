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
import { SKILLS } from '@/lib/skills'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { absoluteUrl } from '@/lib/site'

const TITLE = 'Agent skills — Hoverlab'
const DESCRIPTION =
  'Teach your coding agent the Hoverlab catalog: what is in it, which rung to reach for, and how to install. Free, versioned, and installable with one command.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/docs/skills' },
  openGraph: {
    url: absoluteUrl('/docs/skills'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function DocsSkillsPage() {
  return (
    <>
      <DocsTitle
        eyebrow="Skills"
        title="Teach your agent the catalog"
        intro={
          <>
            An agent that has never heard of Hoverlab writes its own loader, and
            it writes a worse one. A skill is a markdown file that tells it what
            is here — {TOTAL_COUNT.toLocaleString('en-US')} effects,{' '}
            {BLOCK_COUNT} blocks, pages and templates — which rung to reach for,
            and how to install it. Every skill is free.
          </>
        }
      />

      <DocsSection id="install" title="Install one">
        <Snippet label="terminal">{`npx hoverlab skill hoverlab`}</Snippet>
        <p>
          That writes <C>.claude/skills/hoverlab/SKILL.md</C> into the current
          project — the path Claude Code and Claude Desktop read. Start a new
          session and the agent picks it up. Run <C>npx hoverlab skill</C> with
          no id to list what is available, or <C>--dir</C> to write somewhere
          else if your agent keeps skills elsewhere.
        </p>
        <Callout>
          A skill is plain markdown with two lines of front matter. Any agent
          that can read a file can use one — the install path is the only part
          that is Claude-specific.
        </Callout>
      </DocsSection>

      <DocsSection id="available" title="What's available">
        <DocsTable
          head={['Skill', 'What it does']}
          rows={SKILLS.map((skill) => [
            <C key={skill.id}>{skill.id}</C>,
            skill.description,
          ])}
        />
        <p>
          Start with <C>hoverlab</C> — it covers the four rungs, the CLI verbs
          and the MCP tools, and it is the one that stops an agent hand-rolling
          a component that already exists. The rest add taste for a specific
          kind of work and assume the first one is present.
        </p>
      </DocsSection>

      <DocsSection id="fetch" title="Read one without installing">
        <p>
          Every skill is served from the public API, unauthenticated like the
          rest of it. <C>?format=raw</C> returns the markdown itself, so an
          agent that can fetch a URL can be pointed straight at it.
        </p>
        <Snippet label="terminal">{`curl https://hoverlab.dev/api/v1/skills
curl https://hoverlab.dev/api/v1/skills/hoverlab?format=raw`}</Snippet>
      </DocsSection>

      <DocsSection id="mcp" title="Skills and MCP together">
        <p>
          They do different jobs and the pair is better than either alone. The{' '}
          <Link href="/docs/mcp" className="font-medium text-primary hover:underline">
            MCP server
          </Link>{' '}
          gives an agent the ability to search and install; a skill gives it the
          judgement about when to. An agent with MCP and no skill has the tools
          and no reason to pick them up.
        </p>
        <Snippet label="terminal">{`npx hoverlab skill hoverlab
claude mcp add hoverlab -- npx -y hoverlab mcp`}</Snippet>
        <p>
          Neither needs an account. The CLI, the API and the MCP server are all
          open — see{' '}
          <Link href="/docs/api" className="font-medium text-primary hover:underline">
            the API docs
          </Link>{' '}
          for why.
        </p>
      </DocsSection>
    </>
  )
}
