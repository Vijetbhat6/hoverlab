/**
 * /menu — the whole bill of fare, and the page the site exists for.
 *
 *   food       three courses, typeset
 *   wine       a separate list, because it is priced by the glass and bottle
 *   answers    allergens, dietary requirements, the set lunch, corkage
 *   book       the table
 *
 * TWO <MenuCourseList>s RATHER THAN ONE WITH SIX COURSES. Food and drink
 * are read differently: a diner reads the food list once, top to bottom,
 * choosing three things; they read the wine list by price and by colour,
 * scanning a column. Splitting them lets the wine list carry its own
 * standfirst about corkage and its own two-price format ("9 / 34") without
 * that convention leaking into the food, where it would read as an error.
 *
 * The two lists also need distinct headings for a reason that is not
 * aesthetic — <MenuCourseList>'s section label is derived from its heading,
 * so two identically headed menus on one page would announce the second as
 * the first. Same class of duplicate-id problem the catalog hits every time
 * a block is used twice; here it is solved by the content being genuinely
 * different rather than by a prop.
 *
 * NO PHOTOGRAPHY ON THIS PAGE AND THAT IS A DECISION. A photograph of one
 * dish sets an expectation about plating that a kitchen changing its menu
 * weekly cannot meet, and a grid of twelve makes the page take four seconds
 * to load on the phone of someone standing outside deciding whether to come
 * in. The words are the product.
 *
 * <FaqCategorized> RATHER THAN <FaqAccordion>: the questions fall into three
 * genuinely separate groups — allergies, dietary requirements, and the
 * practical stuff about lunch and corkage — and a diner with a nut allergy
 * should not have to read about corkage to find their answer.
 *
 * Anchors are prefixed `mn-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { MenuCourseList } from '@/lib/blocks/sources/menu-course-list'
import { FaqCategorized } from '@/lib/blocks/sources/faq-categorized'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const FOOD = [
  {
    name: 'To begin',
    note: 'Served until 3pm on Sundays',
    dishes: [
      {
        name: 'Devilled eggs, brown crab, lovage',
        description: 'Six halves. The crab is picked here on the morning it arrives.',
        price: '9',
        marks: ['gf', 's'],
      },
      {
        name: 'Bread and cultured butter',
        description: 'Sourdough from the Tuesday bake, salted butter churned in house.',
        price: '5',
        marks: ['v'],
      },
      {
        name: 'Chicory, pear, hazelnut, aged ewe’s cheese',
        description: 'Bitter, sweet, salt. The pears are from a single orchard in Herefordshire.',
        price: '11',
        marks: ['v', 'gf', 'n'],
      },
      {
        name: 'Potted shrimp on toast',
        description: 'Morecambe Bay brown shrimp, mace and cayenne, clarified butter.',
        price: '12',
        marks: ['s'],
      },
      {
        name: 'Leeks, burnt cream, sherry vinegar',
        description: 'Charred whole over embers, then dressed while still hot.',
        price: '10',
        marks: ['v', 'gf'],
      },
    ],
  },
  {
    name: 'Larger',
    note: 'All served with greens; potatoes are £5 and worth it',
    dishes: [
      {
        name: 'Hogget shoulder for two, anchovy and rosemary',
        description:
          'Four hours in the wood oven, carved at the table. Comes with greens and dripping potatoes.',
        price: '58',
        marks: ['gf'],
        signature: true,
      },
      {
        name: 'Whole plaice, brown butter, capers, sea beet',
        description: 'On the bone. Ask and we will take it off for you.',
        price: '28',
        marks: ['gf'],
      },
      {
        name: 'Barley, wild mushroom, pickled walnut, curd',
        description: 'The mushrooms change weekly; ask what came in.',
        price: '21',
        marks: ['v', 'n'],
      },
      {
        name: 'Dry-aged rib chop, bone marrow butter',
        description: 'Thirty-five days on the bone. Priced by weight on the day.',
        price: 'market price',
        marks: ['gf'],
      },
      {
        name: 'Salt-baked celeriac, hazelnut picada, sprouting broccoli',
        description: 'Ninety minutes in a salt crust, cracked open in the dining room.',
        price: '19',
        marks: ['ve', 'df', 'n'],
      },
    ],
  },
  {
    name: 'To finish',
    note: 'Cheese £4 a cut, £14 for four, from Bath Soft and Neal’s Yard',
    dishes: [
      {
        name: 'Burnt honey and thyme tart',
        description: 'Crème fraîche. The honey is from the roof of the building next door.',
        price: '10',
        marks: ['v'],
      },
      {
        name: 'Quince, brown sugar, oat cream',
        description: 'Poached slowly until it goes the colour of a penny.',
        price: '9',
        marks: ['ve', 'df'],
      },
      {
        name: 'Salted caramel and malt ice cream',
        description: 'One scoop, two scoops, or three if the table is sharing.',
        price: '5 / 8 / 10',
        marks: ['v', 'gf'],
      },
      {
        name: 'Chocolate, olive oil, sea salt',
        description: 'Made in the morning, set by service. When it is gone it is gone.',
        price: '9',
        marks: ['v', 'gf'],
      },
    ],
  },
]

const DRINK = [
  {
    name: 'By the glass',
    note: '125ml / 175ml / bottle',
    dishes: [
      {
        name: 'Bacchus, Dunleavy Vineyards, Somerset 2024',
        description: 'Elderflower and green apple. Grown eleven miles from this room.',
        price: '7 / 9 / 34',
        marks: ['ve'],
      },
      {
        name: 'Gamay, Domaine Dupré, Beaujolais 2023',
        description: 'Chilled, light, and the answer to most of the food on the left.',
        price: '8 / 11 / 42',
        marks: ['ve'],
      },
      {
        name: 'Nebbiolo, Produttori del Barbaresco 2020',
        description: 'For the hogget, or the rib chop, or both.',
        price: '12 / 16 / 62',
      },
      {
        name: 'Pét-nat, Offbeat Wines, Wiltshire 2024',
        description: 'Cloudy, dry, faintly of cider. The one the staff drink.',
        price: '9 / — / 44',
        marks: ['ve'],
      },
    ],
  },
  {
    name: 'Beer, cider and no alcohol',
    note: 'The alcohol-free list is a real list and not one token bottle',
    dishes: [
      { name: 'Lost & Grounded Keller Pils, Bristol', description: '330ml, 4.8%', price: '6' },
      { name: 'Wilding Cider, Somerset', description: '375ml bottle, 6.5%, bone dry', price: '9' },
      {
        name: 'Small Beer Session Pale, 2.1%',
        description: 'Brewed to be low, not de-alcoholised afterwards.',
        price: '5',
      },
      {
        name: 'Æcorn Aromatic, verjuice and gentian',
        description: 'Bitter, not sweet. Served with soda and a twist.',
        price: '7',
      },
      {
        name: 'Ballymaloe apple and elderflower soda',
        description: 'Made in house, no added sugar.',
        price: '4',
      },
    ],
  },
]

const QUESTIONS = [
  {
    name: 'Allergies',
    questions: [
      {
        question: 'Can you cook around a severe allergy?',
        answer:
          'Usually, and we would rather know when you book than when you sit down. We cook in one small kitchen with shared equipment, so we cannot promise any dish is free of a trace of anything — we will tell you honestly which dishes we are confident about and which we are not.',
      },
      {
        question: 'What do the letters after each dish mean?',
        answer:
          'They are at the foot of the menu: (v) vegetarian, (ve) vegan, (gf) gluten free, (df) dairy free, (n) contains nuts, (s) contains shellfish. They describe the dish as written — several can be changed, so ask.',
      },
      {
        question: 'Is the kitchen nut free?',
        answer:
          'No. We use hazelnuts and walnuts most weeks and they are stored and prepared in the same room. If that is a problem we will say so when you book rather than let you find out on the night.',
      },
    ],
  },
  {
    name: 'Dietary requirements',
    questions: [
      {
        question: 'Is there always a vegan option?',
        answer:
          'At every course, and it is a dish rather than a substitution — the salt-baked celeriac is the one the kitchen is proudest of this month. We do not do a separate vegan menu because it always ends up being the shorter one.',
      },
      {
        question: 'Can you do a gluten-free version of the bread?',
        answer:
          'No, and we would rather say so than serve a bad one. Most of the rest of the menu is gluten free as written; the marks on the menu are accurate.',
      },
    ],
  },
  {
    name: 'Practicalities',
    questions: [
      {
        question: 'Is there a set lunch?',
        answer:
          'Sundays only — two courses £26, three for £32, from noon until half past three. It is drawn from the same menu, not a cheaper one, and the hogget is on it most weeks.',
      },
      {
        question: 'Can I bring my own wine?',
        answer:
          'Wednesdays and Thursdays, £18 corkage a bottle, two bottles a table. Not on Friday or Saturday, when we need the table turn and the list to pay for itself.',
      },
      {
        question: 'Do you add a service charge?',
        answer:
          'A discretionary 12.5% on tables of six or more. It goes to the people who served you and is split evenly with the kitchen, which is not the industry norm. Ask us to remove it and we will, without a conversation about it.',
      },
      {
        question: 'How often does the menu change?',
        answer:
          'When the produce does, which in practice is most Wednesdays. This page is the menu — there is no printed one — so what you are reading now is what the kitchen is working from tonight.',
      },
    ],
  },
]

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Quay & Larder"
        links={[
          { label: 'Menu', href: '#mn-food' },
          { label: 'Wine', href: '#mn-drink' },
          { label: 'Find us', href: '#' },
        ]}
        activeLabel="Menu"
        ctaLabel="Book a table"
        ctaHref="#mn-book"
      />

      <main>
        <div id="mn-food">
          <MenuCourseList
            heading="Dinner"
            standfirst="Wednesday to Sunday, six until ten, kitchen closes at half past nine. One menu, changed when the produce changes rather than on a schedule — which is why there is no printed copy and this page is the only one."
            courses={FOOD}
          />
        </div>

        <div id="mn-drink">
          <MenuCourseList
            heading="To drink"
            standfirst="A short list, mostly from within a day’s drive, and priced so the second bottle is not a decision. Corkage is £18 on Wednesdays and Thursdays."
            courses={DRINK}
            footnote="Wines by the glass are poured to line from a measure at the pass, and we will always let you taste before the bottle is finished. The alcohol-free list is a proper list — we got tired of restaurants offering one sad bottle of grape juice."
          />
        </div>

        <FaqCategorized
          eyebrow="Before you order"
          heading="Allergies, diets and the practical things"
          topics={QUESTIONS}
        />

        <div id="mn-book">
          <CtaSplitPanel
            heading="Book a table"
            supporting="Thirty-eight covers and one sitting a night, so weekends go about ten days ahead. Wednesdays are usually free at short notice and are the better meal."
            primaryLabel="Check availability"
            secondaryLabel="Call 0117 946 2210"
            reassurance={[
              { text: 'Tell us about allergies when you book, not on the night' },
              { text: 'Cancel free up to 24 hours before' },
              { text: 'Corkage £18 on Wednesdays and Thursdays' },
            ]}
          />
        </div>
      </main>

      <FooterMinimal
        brand="Quay & Larder"
        links={[
          { label: 'Menu', href: '#mn-food' },
          { label: 'Wine', href: '#mn-drink' },
          { label: 'Book', href: '#mn-book' },
          { label: 'Gift vouchers', href: '#' },
        ]}
      />
    </div>
  )
}
