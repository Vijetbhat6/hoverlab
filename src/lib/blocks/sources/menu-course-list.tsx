/**
 * <MenuCourseList> — a menu typeset as a bill of fare, not as a product grid.
 *
 * The default instinct is to render a restaurant menu as cards: a photo, a
 * title, a price, a button. That is a storefront, and it is wrong for this
 * content in a way that costs the restaurant money. A menu is read in one
 * pass, at a table, by someone deciding between eleven things — so it wants
 * the shape print settled on a century ago: courses as headings, one line
 * per dish, the price on the end edge, and a leader joining the two so the
 * eye can cross a wide column without losing its row.
 *
 * THE LEADER IS THE WHOLE TRICK, and it is a border rather than a row of
 * literal dots. A string of "..." is read out character by character by a
 * screen reader and re-wraps unpredictably when a dish name is long; a
 * dotted bottom border on a flex spacer is decorative by construction,
 * announces nothing, and grows to whatever width is left over.
 *
 * DIETARY MARKS ARE ABBREVIATIONS WITH A KEY, not emoji or colour. A green
 * dot meaning vegetarian fails for the reader who cannot see green and says
 * nothing to the one who can; "(v)" with a key at the foot of the menu is
 * how printed menus have always solved it, and it survives being copied
 * into a text message. Each mark carries a `<abbr title>` so the long form
 * is one hover or one focus away.
 *
 * Prices are plain strings, not numbers. A menu quotes "14" or "14.50" or
 * "market price" or "9 / 16" for two pour sizes, and a numeric type plus a
 * currency formatter cannot express three of those four.
 */

import * as React from 'react'

/** Long forms for the marks, so the key and the abbr cannot disagree. */
const MARK_MEANINGS: Record<string, string> = {
  v: 'Vegetarian',
  ve: 'Vegan',
  gf: 'Gluten free',
  df: 'Dairy free',
  n: 'Contains nuts',
  s: 'Contains shellfish',
}

export interface MenuDish {
  name: string
  /** One line. Ingredients in the order they are tasted, not alphabetically. */
  description?: string
  /** A string, not a number — "14", "9 / 16" and "market price" are all valid. */
  price: string
  /** Keys of `MARK_MEANINGS`, e.g. `['v', 'gf']`. */
  marks?: string[]
  /** Renders the dish in the house's emphasis style. Use sparingly. */
  signature?: boolean
}

export interface MenuCourse {
  name: string
  /** A note under the course heading — a serving rule, a time limit, a price. */
  note?: string
  dishes: MenuDish[]
}

export interface MenuCourseListProps {
  heading?: string
  /** The line under the heading: service times, a set-price note, a source. */
  standfirst?: string
  courses?: MenuCourse[]
  /** Shown at the foot, above the key. Allergen and service-charge wording. */
  footnote?: string
  className?: string
}

const DEFAULT_COURSES: MenuCourse[] = [
  {
    name: 'To begin',
    note: 'Served until 3pm',
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
    ],
  },
  {
    name: 'Larger',
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
        description: 'Thirty-five days. Priced by weight on the day.',
        price: 'market price',
        marks: ['gf'],
      },
    ],
  },
  {
    name: 'To finish',
    note: 'Or a cheese plate, £4 a cut, £14 for four',
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
    ],
  },
]

/** One dish: name and marks on the start edge, price on the end, leader between. */
function Dish({ dish }: { dish: MenuDish }) {
  return (
    <li className="pt-4 first:pt-0">
      {/* `items-baseline` and not `items-center`: the leader must sit on the
          same baseline as the two things it joins, or it reads as a rule
          under the name rather than as a line across to the price. */}
      <div className="flex items-baseline gap-2">
        <h4
          className={`shrink-0 text-[0.95rem] leading-snug ${
            dish.signature ? 'font-semibold text-foreground' : 'font-medium text-card-foreground'
          }`}
        >
          {dish.name}
          {dish.marks?.length ? (
            <span className="ms-2 whitespace-nowrap text-xs font-normal text-muted-foreground">
              {dish.marks.map((mark, i) => (
                <React.Fragment key={mark}>
                  {i > 0 ? ' ' : null}
                  <abbr
                    title={MARK_MEANINGS[mark] ?? mark}
                    className="no-underline decoration-dotted underline-offset-2 hover:underline"
                  >
                    ({mark})
                  </abbr>
                </React.Fragment>
              ))}
            </span>
          ) : null}
        </h4>

        {/* The leader. Decorative by construction — a border, not text — so
            it is announced by nothing and wraps to whatever is left. */}
        <span
          aria-hidden
          className="min-w-4 flex-1 translate-y-[-0.3rem] border-b border-dotted border-border"
        />

        <span className="shrink-0 text-[0.95rem] font-medium tabular-nums text-card-foreground">
          {dish.price}
        </span>
      </div>

      {dish.description ? (
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {dish.description}
        </p>
      ) : null}
    </li>
  )
}

export function MenuCourseList({
  heading = 'Dinner',
  standfirst = 'Served Wednesday to Sunday, 6pm until 10pm. One kitchen, one menu, changed when the produce changes rather than on a schedule.',
  courses = DEFAULT_COURSES,
  footnote = 'Please tell us about allergies before you order — we cook in one kitchen and cannot promise any dish is free of a trace. A discretionary 12.5% service charge is added to tables of six or more and goes to the people who served you.',
  className = '',
}: MenuCourseListProps) {
  /* Only the marks actually used, so the key never lists an abbreviation
     that appears nowhere on the menu above it. */
  const usedMarks = [...new Set(courses.flatMap((c) => c.dishes.flatMap((d) => d.marks ?? [])))]

  return (
    <section
      aria-label={heading}
      className={`mx-auto w-full max-w-3xl px-6 py-16 sm:py-20 ${className}`}
    >
      <header className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{heading}</h2>
        {standfirst ? (
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {standfirst}
          </p>
        ) : null}
      </header>

      <div className="mt-12 space-y-12">
        {courses.map((course) => (
          <div key={course.name}>
            <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {course.name}
              </h3>
              {course.note ? (
                <p className="text-xs text-muted-foreground/80">{course.note}</p>
              ) : null}
            </div>

            <ul className="mt-5 divide-y divide-border/50">
              {course.dishes.map((dish) => (
                <Dish key={dish.name} dish={dish} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {usedMarks.length ? (
        <dl className="mt-12 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-border pt-6 text-xs text-muted-foreground">
          {usedMarks.map((mark) => (
            <div key={mark} className="flex items-center gap-1.5">
              <dt className="font-semibold">({mark})</dt>
              <dd>{MARK_MEANINGS[mark] ?? mark}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {footnote ? (
        <p className="mx-auto mt-6 max-w-xl text-center text-xs leading-relaxed text-muted-foreground/80">
          {footnote}
        </p>
      ) : null}
    </section>
  )
}
