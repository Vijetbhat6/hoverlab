'use client'

/**
 * The preview arrangement for each primitive.
 *
 * A block previews as itself: it is a whole section, so rendering it is the
 * demo. A primitive is one control, and one control on a card says almost
 * nothing — a single grey button does not show that there are six variants,
 * a loading state and an icon size. So each primitive gets a small
 * composition here, and the composition is what the grid and the detail
 * page render.
 *
 * These are NOT shipped. `build-artifact-sources.mjs` pairs a catalog id
 * with `sources/<id>.tsx` and inlines that; this file is not in the pairing
 * and never reaches a buyer. It exists so a demo can hold state — which is
 * the other reason it is separate from `registry.tsx`: half of these
 * controls are `value` + `onChange` pairs with no uncontrolled mode, and a
 * demo for one has to be a client component. Keeping the directive here
 * lets the registry stay neutral, so the primitive pages can still be
 * server-rendered.
 *
 * Nothing here re-implements a primitive. Every demo renders the real
 * component from `./sources`, which is what makes the preview and the
 * source incapable of drifting.
 */

import * as React from 'react'
import {
  Bold,
  Italic,
  Underline,
  Search,
  Rocket,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

import { AvatarGroup } from './sources/avatar-group'
import { Badge } from './sources/badge'
import { BrowserFrame } from './sources/browser-frame'
import { Button } from './sources/button'
import { ButtonGroup } from './sources/button-group'
import { Calendar } from './sources/calendar'
import { ColorPicker } from './sources/color-picker'
import { Combobox } from './sources/combobox'
import { DatePicker } from './sources/date-picker'
import { DurationInput } from './sources/duration-input'
import { RelativeTime } from './sources/relative-time'
import { TimePicker } from './sources/time-picker'
import { ContentDivider } from './sources/content-divider'
import { DeviceShowcase } from './sources/device-showcase'
import { LaptopFrame } from './sources/laptop-frame'
import { PhoneFrame } from './sources/phone-frame'
import { CreditCardInput, type CreditCardValue } from './sources/credit-card'
import { EmojiSelector } from './sources/emoji-selector'
import { FeaturedIcon } from './sources/featured-icon'
import { Field } from './sources/field'
import { GradientPicker, type GradientValue } from './sources/gradient-picker'
import { ImagePicker } from './sources/image-picker'
import { InputGroup } from './sources/input-group'
import { Kbd } from './sources/kbd'
import { ProgressSteps } from './sources/progress-steps'
import { QrCode } from './sources/qr-code'
import { Rating } from './sources/rating'
import { SegmentedControl } from './sources/segmented-control'
import { Skeleton } from './sources/skeleton'
import { SocialButtons } from './sources/social-buttons'
import { StatusBadge } from './sources/status-badge'
import { Stepper } from './sources/stepper'
import { TagInput } from './sources/tag-chip'
import { TreeView } from './sources/tree-view'
import { VerificationCodeInput } from './sources/verification-code-input'
import { VideoPlayer } from './sources/video-player'

/** Shared frame: centred, padded, and never wider than a card. */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 p-6">
      {children}
    </div>
  )
}

/* ---------------------------- Actions ----------------------------- */

export function ButtonDemo() {
  return (
    <Stage>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" icon={<Sparkles className="h-3.5 w-3.5" />}>
          With icon
        </Button>
        <Button loading>Saving</Button>
        <Button size="icon" aria-label="Dismiss" variant="outline">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Stage>
  )
}

export function ButtonGroupDemo() {
  return (
    <Stage>
      <ButtonGroup
        label="Text style"
        items={[
          { value: 'bold', icon: <Bold className="h-3.5 w-3.5" />, 'aria-label': 'Bold' },
          { value: 'italic', icon: <Italic className="h-3.5 w-3.5" />, 'aria-label': 'Italic' },
          {
            value: 'underline',
            icon: <Underline className="h-3.5 w-3.5" />,
            'aria-label': 'Underline',
          },
        ]}
      />
      <ButtonGroup
        label="Range"
        items={[{ value: 'd', label: 'Day' }, { value: 'w', label: 'Week' }, { value: 'm', label: 'Month' }]}
      />
    </Stage>
  )
}

export function SocialButtonsDemo() {
  const [pending, setPending] = React.useState<'google' | null>(null)
  void setPending
  return (
    <Stage>
      <div className="w-full max-w-xs">
        <SocialButtons providers={['google', 'github', 'apple']} pending={pending} />
      </div>
    </Stage>
  )
}

/* ------------------------- Form Controls -------------------------- */

export function FieldDemo() {
  return (
    <Stage>
      <div className="flex w-full max-w-xs flex-col gap-4">
        <Field label="Workspace name" hint="Shown to everyone you invite." required>
          {(props) => (
            <input
              {...props}
              defaultValue="Northwind"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </Field>
        <Field label="Subdomain" hint="Letters and numbers only." error="That subdomain is taken.">
          {(props) => (
            <input
              {...props}
              defaultValue="northwind"
              className="h-9 rounded-lg border border-destructive bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </Field>
      </div>
    </Stage>
  )
}

export function InputGroupDemo() {
  return (
    <Stage>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <InputGroup addonStart="https://" addonEnd=".com" defaultValue="northwind" />
        <InputGroup iconStart={<Search className="h-4 w-4" />} placeholder="Search everything…" />
        <InputGroup
          addonStart="$"
          defaultValue="49"
          addonEnd="per month"
          inputMode="decimal"
        />
      </div>
    </Stage>
  )
}

export function VerificationCodeInputDemo() {
  const [code, setCode] = React.useState('418')
  return (
    <Stage>
      <VerificationCodeInput value={code} onChange={setCode} />
      <p className="text-xs text-muted-foreground">Paste the whole code into any box.</p>
    </Stage>
  )
}

export function StepperDemo() {
  const [seats, setSeats] = React.useState(3)
  return (
    <Stage>
      <Stepper label="Seats" value={seats} onChange={setSeats} min={1} max={20} unit="seats" />
      <Stepper label="Quantity" defaultValue={1} min={0} max={9} size="sm" />
    </Stage>
  )
}

export function KbdDemo() {
  return (
    <Stage>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          Search <Kbd keys="mod+k" />
        </span>
        <span className="inline-flex items-center gap-2">
          Command palette <Kbd keys="mod+shift+p" />
        </span>
        <span className="inline-flex items-center gap-2">
          Go to inbox <Kbd keys="g then i" />
        </span>
      </div>
    </Stage>
  )
}

/* --------------------------- Selection ---------------------------- */

const PEOPLE = [
  { value: 'ada', label: 'Ada Lovelace', hint: 'ada@northwind.co' },
  { value: 'alan', label: 'Alan Turing', hint: 'alan@northwind.co' },
  { value: 'grace', label: 'Grace Hopper', hint: 'grace@northwind.co' },
  { value: 'katherine', label: 'Katherine Johnson', hint: 'kj@northwind.co' },
]

export function ComboboxDemo() {
  const [value, setValue] = React.useState<string | null>('grace')
  return (
    <Stage>
      <div className="w-full max-w-xs">
        <Combobox label="Assignee" options={PEOPLE} value={value} onChange={setValue} />
      </div>
    </Stage>
  )
}

export function SegmentedControlDemo() {
  const [view, setView] = React.useState('board')
  const [term, setTerm] = React.useState('yearly')
  return (
    <Stage>
      <SegmentedControl
        label="View"
        value={view}
        onChange={setView}
        options={[
          { value: 'board', label: 'Board' },
          { value: 'list', label: 'List' },
          { value: 'calendar', label: 'Calendar' },
        ]}
      />
      <SegmentedControl
        label="Billing period"
        size="sm"
        value={term}
        onChange={setTerm}
        options={[
          { value: 'monthly', label: 'Monthly' },
          { value: 'yearly', label: 'Yearly' },
        ]}
      />
    </Stage>
  )
}

export function RatingDemo() {
  const [score, setScore] = React.useState(4)
  return (
    <Stage>
      <Rating value={score} onChange={setScore} label="Your rating" size="lg" />
      <Rating value={4.3} count={1284} />
    </Stage>
  )
}

export function EmojiSelectorDemo() {
  const [reactions, setReactions] = React.useState([
    { emoji: '👍', count: 7, reacted: true },
    { emoji: '🎉', count: 3 },
    { emoji: '🚀', count: 1 },
  ])
  return (
    <Stage>
      <EmojiSelector
        reactions={reactions}
        onToggle={(emoji) =>
          setReactions((list) => {
            const found = list.find((r) => r.emoji === emoji)
            if (!found) return [...list, { emoji, count: 1, reacted: true }]
            return list.map((r) =>
              r.emoji === emoji
                ? { ...r, reacted: !r.reacted, count: r.count + (r.reacted ? -1 : 1) }
                : r,
            )
          })
        }
      />
    </Stage>
  )
}

/* ------------------------ Status & Labels ------------------------- */

export function BadgeDemo() {
  return (
    <Stage>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge tone="brand">Pro</Badge>
        <Badge tone="success">Paid</Badge>
        <Badge tone="warning">Trial</Badge>
        <Badge tone="danger">Overdue</Badge>
        <Badge tone="info">Beta</Badge>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge shape="solid" tone="brand">Solid</Badge>
        <Badge shape="outline" tone="brand">Outline</Badge>
        <Badge shape="soft" tone="neutral" pill>Soft pill</Badge>
      </div>
    </Stage>
  )
}

export function StatusBadgeDemo() {
  return (
    <Stage>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <StatusBadge status="online" />
        <StatusBadge status="pending" label="Deploying" />
        <StatusBadge status="failed" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <StatusBadge status="away" subtle />
        <StatusBadge status="offline" subtle />
        <StatusBadge status="draft" subtle />
      </div>
    </Stage>
  )
}

export function TagChipDemo() {
  const [tags, setTags] = React.useState(['design', 'accessibility', 'shipped'])
  return (
    <Stage>
      <div className="w-full max-w-sm">
        <TagInput label="Tags" value={tags} onChange={setTags} />
      </div>
    </Stage>
  )
}

export function SkeletonDemo() {
  return (
    <Stage>
      <div className="flex w-full max-w-sm items-start gap-3">
        <Skeleton shape="avatar" />
        <div className="flex-1">
          <Skeleton shape="text" lines={3} />
        </div>
      </div>
      <div className="flex w-full max-w-sm gap-3">
        <Skeleton shape="thumbnail" />
        <Skeleton shape="button" />
      </div>
    </Stage>
  )
}

/* --------------------- Navigation & Steps ------------------------- */

export function ProgressStepsDemo() {
  return (
    <Stage>
      <div className="w-full max-w-md">
        <ProgressSteps
          label="Checkout"
          current={2}
          steps={[
            { label: 'Cart' },
            { label: 'Delivery' },
            { label: 'Payment' },
            { label: 'Done' },
          ]}
        />
      </div>
    </Stage>
  )
}

export function TreeViewDemo() {
  const [selected, setSelected] = React.useState('button.tsx')
  return (
    <Stage>
      <div className="w-full max-w-xs text-start">
        <TreeView
          label="Project files"
          selectedId={selected}
          onSelect={(node) => setSelected(node.id)}
          defaultExpanded={['src', 'components']}
          nodes={[
            {
              id: 'src',
              label: 'src',
              children: [
                {
                  id: 'components',
                  label: 'components',
                  children: [
                    { id: 'button.tsx', label: 'button.tsx' },
                    { id: 'field.tsx', label: 'field.tsx' },
                  ],
                },
                { id: 'app.tsx', label: 'app.tsx' },
              ],
            },
            { id: 'package.json', label: 'package.json' },
          ]}
        />
      </div>
    </Stage>
  )
}

/* --------------------------- Identity ----------------------------- */

export function AvatarGroupDemo() {
  return (
    <Stage>
      <AvatarGroup
        size="lg"
        people={[
          { name: 'Ada Lovelace' },
          { name: 'Alan Turing' },
          { name: 'Grace Hopper' },
          { name: 'Katherine Johnson' },
          { name: 'Edsger Dijkstra' },
          { name: 'Barbara Liskov' },
        ]}
      />
      <AvatarGroup
        size="sm"
        max={3}
        people={[{ name: 'Ada Lovelace' }, { name: 'Alan Turing' }, { name: 'Grace Hopper' }]}
      />
    </Stage>
  )
}

export function FeaturedIconDemo() {
  return (
    <Stage>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <FeaturedIcon tone="brand" variant="soft">
          <Rocket />
        </FeaturedIcon>
        <FeaturedIcon tone="success" variant="solid">
          <ShieldCheck />
        </FeaturedIcon>
        <FeaturedIcon tone="warning" variant="outline">
          <Sparkles />
        </FeaturedIcon>
        <FeaturedIcon tone="brand" variant="ring" size="xl" circle>
          <Rocket />
        </FeaturedIcon>
      </div>
    </Stage>
  )
}

/* ----------------------- Pickers & Media -------------------------- */

export function ColorPickerDemo() {
  const [color, setColor] = React.useState('#6366f1')
  return (
    <Stage>
      <div className="w-full max-w-xs">
        <ColorPicker label="Brand colour" value={color} onChange={setColor} />
      </div>
    </Stage>
  )
}

export function GradientPickerDemo() {
  const [gradient, setGradient] = React.useState<GradientValue>({
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#6366f1', position: 0 },
      { color: '#ec4899', position: 55 },
      { color: '#f59e0b', position: 100 },
    ],
  })
  return (
    <Stage>
      <div className="w-full max-w-sm">
        <GradientPicker value={gradient} onChange={setGradient} />
      </div>
    </Stage>
  )
}

export function ImagePickerDemo() {
  const [file, setFile] = React.useState<File | null>(null)
  return (
    <Stage>
      <div className="w-full max-w-sm">
        <ImagePicker value={file} onChange={setFile} />
      </div>
    </Stage>
  )
}

export function CreditCardDemo() {
  const [card, setCard] = React.useState<CreditCardValue>({
    number: '4242424242424242',
    expiry: '04/27',
    cvc: '123',
    name: 'A. Lovelace',
  })
  return (
    <Stage>
      <div className="w-full max-w-sm">
        <CreditCardInput value={card} onChange={setCard} />
      </div>
    </Stage>
  )
}

export function QrCodeDemo() {
  return (
    <Stage>
      <div className="flex items-center gap-4">
        <QrCode value="https://hoverlab.dev/primitives" size={132} />
        <div className="text-start text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Scannable, not decorative.</p>
          <p className="mt-1">Reed-Solomon, mask scoring, zero dependencies.</p>
        </div>
      </div>
    </Stage>
  )
}

export function VideoPlayerDemo() {
  return (
    <Stage>
      <div className="w-full max-w-sm">
        <VideoPlayer
          label="Product tour"
          poster="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%236366f1'/%3E%3Cstop offset='1' stop-color='%230f172a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='16' height='9' fill='url(%23g)'/%3E%3C/svg%3E"
        />
      </div>
    </Stage>
  )
}

/* --------------------------- Structure ---------------------------- */

export function ContentDividerDemo() {
  return (
    <Stage>
      <div className="flex w-full max-w-xs flex-col gap-4">
        <ContentDivider>or</ContentDivider>
        <ContentDivider align="start">Today</ContentDivider>
        <ContentDivider tone="accent" dashed>
          Unread from here
        </ContentDivider>
      </div>
    </Stage>
  )
}

/* ------------------------- Frames & Mocks ------------------------- */

/**
 * A drawn screen for the frames to hold.
 *
 * Every frame demo needs something inside it, and a grey rectangle shows
 * nothing about the one property these frames have that an image-based
 * mockup does not: the contents are real markup that inherits the page's
 * theme. So the filler is a tiny interface — a bar, a heading, a couple of
 * rows — and it is the same one in all four demos, which makes the frames
 * comparable to each other rather than to their own filler.
 */
function ScreenFill({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-muted/40 to-background">
      <div className="flex items-center gap-1.5 border-b border-border/70 px-3 py-2">
        <span className="size-4 rounded bg-primary/70" />
        {!compact ? <span className="h-2 w-14 rounded-full bg-foreground/20" /> : null}
        <span className="ms-auto h-2 w-6 rounded-full bg-foreground/15" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <span className="h-2.5 w-2/3 rounded-full bg-foreground/25" />
        <span className="h-2 w-1/2 rounded-full bg-foreground/15" />
        <div className={`mt-1 grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <span className="h-9 rounded-md bg-muted" />
          <span className="h-9 rounded-md bg-muted" />
          <span className="h-9 rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}

export function BrowserFrameDemo() {
  return (
    <Stage>
      <div className="w-full max-w-md">
        <BrowserFrame url="acme.example/dashboard">
          <ScreenFill />
        </BrowserFrame>
      </div>
    </Stage>
  )
}

export function PhoneFrameDemo() {
  return (
    <Stage>
      {/* Two cut-outs side by side, because the whole claim of this primitive
          is that the platform is a prop rather than a second file. */}
      <div className="flex items-end gap-5">
        <PhoneFrame width={132} cutout="island">
          <ScreenFill compact />
        </PhoneFrame>
        <PhoneFrame width={132} cutout="punch">
          <ScreenFill compact />
        </PhoneFrame>
      </div>
    </Stage>
  )
}

export function LaptopFrameDemo() {
  return (
    <Stage>
      <LaptopFrame width={300}>
        <ScreenFill />
      </LaptopFrame>
    </Stage>
  )
}

export function DeviceShowcaseDemo() {
  return (
    <Stage>
      <DeviceShowcase
        width={300}
        desktop={<ScreenFill />}
        mobile={<ScreenFill compact />}
      />
    </Stage>
  )
}


/* --------------------------- Date & Time -------------------------- */

/**
 * A fixed date, not `new Date()`.
 *
 * These demos render on the server too, and one seeded from the current
 * time can format one month there and the next one in the browser. A fixed
 * selection pins the month the preview opens on, which also stops the
 * screenshot harness producing a fresh diff every midnight.
 *
 * Note what is NOT passed: `month`. Handing the calendar a controlled month
 * without an `onMonthChange` to go with it freezes the two arrows, and a
 * demo whose controls do nothing is worse than no demo.
 */
const SEED_DATE = new Date(2026, 8, 17)

export function CalendarDemo() {
  const [date, setDate] = React.useState<Date | null>(SEED_DATE)
  return (
    <Stage>
      <Calendar
        label="Departure date"
        value={date}
        onChange={setDate}
        weekStartsOn={1}
        isDisabled={(d) => d.getDay() === 0}
      />
    </Stage>
  )
}

export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date | null>(SEED_DATE)
  return (
    <Stage>
      <div className="w-56">
        <DatePicker label="Invoice date" value={date} onChange={setDate} />
      </div>
    </Stage>
  )
}

export function TimePickerDemo() {
  const [time, setTime] = React.useState<number | null>(570)
  return (
    <Stage>
      <div className="w-56">
        <TimePicker
          label="Meeting time"
          value={time}
          onChange={setTime}
          min={9 * 60}
          max={17 * 60}
          step={30}
          timeZone="GMT+1"
          unavailable={[10 * 60, 10 * 60 + 30, 14 * 60]}
        />
      </div>
    </Stage>
  )
}

export function RelativeTimeDemo() {
  /* Offsets from mount rather than fixed dates, so the wording is the point
     of the demo — the absolute dates would say nothing about the component. */
  const [base] = React.useState(() => Date.now())
  return (
    <Stage>
      <div className="flex flex-col gap-1.5 text-sm text-foreground">
        {[
          ['Deployed', -45 * 1000],
          ['Last sync', -3 * 60 * 60 * 1000],
          ['Trial ends', 6 * 24 * 60 * 60 * 1000],
        ].map(([label, offset]) => (
          <div key={label as string} className="flex items-baseline gap-2">
            <span className="w-20 text-xs text-muted-foreground">{label}</span>
            <RelativeTime date={new Date(base + (offset as number))} />
          </div>
        ))}
      </div>
    </Stage>
  )
}

export function DurationInputDemo() {
  const [seconds, setSeconds] = React.useState(5400)
  return (
    <Stage>
      <DurationInput label="Session length" value={seconds} onChange={setSeconds} />
      <DurationInput
        label="Estimate"
        value={2700}
        showSeconds={false}
        onChange={() => {}}
      />
    </Stage>
  )
}
