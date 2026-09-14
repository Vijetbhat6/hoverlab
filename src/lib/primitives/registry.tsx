/**
 * Primitive id → the rendered preview for that primitive.
 *
 * The same shape as `blocks/registry.tsx`, and the same two rules.
 *
 * The map holds *elements*, not component types. Looking a component type
 * out of a map and instantiating it as `<Component />` inside a render is
 * the pattern `react-hooks/static-components` exists to catch — it cannot
 * tell a stable module-level map from one rebuilt every render, and a
 * component whose identity changes remounts and drops its state. Storing
 * `<ButtonDemo />` moves the instantiation to module load, where the
 * element object is created once and is genuinely stable.
 *
 * Deliberately NOT a client module. The demos carry their own `'use
 * client'` because half of these controls are `value`/`onChange` pairs, and
 * keeping the directive there rather than here lets the primitive pages
 * stay server-rendered.
 *
 * What it maps to is the demo, not the primitive itself, and that is the
 * one difference from the block registry. A block previews as itself; one
 * button on a card shows none of what the component does. The demos render
 * the real components, so preview and source still cannot drift — see the
 * header of `./demos`.
 */

import type * as React from 'react'

import {
  AvatarGroupDemo,
  BadgeDemo,
  ButtonDemo,
  ButtonGroupDemo,
  ColorPickerDemo,
  ComboboxDemo,
  BrowserFrameDemo,
  CalendarDemo,
  ContentDividerDemo,
  DatePickerDemo,
  DurationInputDemo,
  RelativeTimeDemo,
  TimePickerDemo,
  DeviceShowcaseDemo,
  LaptopFrameDemo,
  PhoneFrameDemo,
  CreditCardDemo,
  EmojiSelectorDemo,
  FeaturedIconDemo,
  FieldDemo,
  GradientPickerDemo,
  ImagePickerDemo,
  InputGroupDemo,
  KbdDemo,
  ProgressStepsDemo,
  QrCodeDemo,
  RatingDemo,
  SegmentedControlDemo,
  SkeletonDemo,
  SocialButtonsDemo,
  StatusBadgeDemo,
  StepperDemo,
  TagChipDemo,
  TreeViewDemo,
  VerificationCodeInputDemo,
  VideoPlayerDemo,
  CitationChipDemo,
  MessageBubbleDemo,
  PromptInputDemo,
  PromptSuggestionsDemo,
  ReasoningPanelDemo,
  ToolCallDemo,
  TypingIndicatorDemo,
} from './demos'

export const PRIMITIVE_PREVIEWS: Record<string, React.ReactNode> = {
  button: <ButtonDemo />,
  'button-group': <ButtonGroupDemo />,
  'social-buttons': <SocialButtonsDemo />,

  field: <FieldDemo />,
  'input-group': <InputGroupDemo />,
  'verification-code-input': <VerificationCodeInputDemo />,
  stepper: <StepperDemo />,
  kbd: <KbdDemo />,

  combobox: <ComboboxDemo />,
  'segmented-control': <SegmentedControlDemo />,
  rating: <RatingDemo />,
  'emoji-selector': <EmojiSelectorDemo />,

  badge: <BadgeDemo />,
  'status-badge': <StatusBadgeDemo />,
  'tag-chip': <TagChipDemo />,
  skeleton: <SkeletonDemo />,

  'progress-steps': <ProgressStepsDemo />,
  'tree-view': <TreeViewDemo />,

  'avatar-group': <AvatarGroupDemo />,
  'featured-icon': <FeaturedIconDemo />,

  'color-picker': <ColorPickerDemo />,
  'gradient-picker': <GradientPickerDemo />,
  'image-picker': <ImagePickerDemo />,
  'credit-card': <CreditCardDemo />,
  'qr-code': <QrCodeDemo />,
  'video-player': <VideoPlayerDemo />,

  calendar: <CalendarDemo />,
  'date-picker': <DatePickerDemo />,
  'time-picker': <TimePickerDemo />,
  'relative-time': <RelativeTimeDemo />,
  'duration-input': <DurationInputDemo />,

  'message-bubble': <MessageBubbleDemo />,
  'prompt-input': <PromptInputDemo />,
  'tool-call': <ToolCallDemo />,
  'reasoning-panel': <ReasoningPanelDemo />,
  'citation-chip': <CitationChipDemo />,
  'typing-indicator': <TypingIndicatorDemo />,
  'prompt-suggestions': <PromptSuggestionsDemo />,

  'content-divider': <ContentDividerDemo />,

  'browser-frame': <BrowserFrameDemo />,
  'phone-frame': <PhoneFrameDemo />,
  'laptop-frame': <LaptopFrameDemo />,
  'device-showcase': <DeviceShowcaseDemo />,
}

/** The preview for a primitive, or undefined if the key is unknown. */
export function getPrimitivePreview(key: string): React.ReactNode | undefined {
  return PRIMITIVE_PREVIEWS[key]
}
