# The pattern behind each component, and where the pattern leaves a choice

Each component names its ARIA Authoring Practices pattern in its own header.
This file collects them, and then says which of them have no single correct
keyboard model, because that is the part that gets argued about in review and
the part a test suite cannot settle.

| Component | Pattern | File |
|---|---|---|
| Dialog | Dialog (Modal) | `src/components/Dialog.tsx` |
| Disclosure | Disclosure | `src/components/Disclosure.tsx` |
| Tabs | Tabs, automatic activation | `src/components/Tabs.tsx` |
| Combobox | Combobox with list autocomplete, manual selection | `src/components/Combobox.tsx` |
| Menu button | Menu Button | `src/components/MenuButton.tsx` |
| Toast region | Alert, with WCAG 4.1.3 Status Messages | `src/components/ToastRegion.tsx` |

## Where there is no single correct answer

**Tabs: automatic or manual activation.** Automatic means an arrow key moves
focus and selects, so panels appear as the user walks the strip. Manual means
arrows move focus and Enter or Space selects. The Practices allow both. The
rule worth applying is the cost of a selection: automatic when the panel is
already rendered, manual when showing it costs a request. This repository
implements automatic, and the audit that checks it says so rather than
presenting the choice as a requirement.

**Combobox: four models, not one.** The Practices describe combobox with no
autocomplete, with list autocomplete and manual selection, with list
autocomplete and automatic selection, and with inline autocomplete. They differ
in whether anything is selected by default and whether the input is edited as
you arrow. This repository implements manual selection, which is the model that
surprises users least, because nothing is committed without a deliberate Enter.
The one thing that is not a choice is where DOM focus lives: it stays in the
text field, and the active option is carried by `aria-activedescendant`.
Moving focus into the list breaks typing.

**Menu: whether a disabled item is skipped.** The Practices allow either
skipping disabled items when arrowing or focusing them and refusing to act.
This repository focuses them and refuses, on the grounds that an action a user
cannot find is harder to explain than one they can read and cannot use. Both
are defensible.

**Menu: typeahead.** Single character typeahead is implemented, so repeated
presses of the same letter cycle through matches. Multi character typeahead,
where typing "exp" lands on Export, is a timing dependent behaviour this
repository does not implement, and saying so is better than half implementing
it.

**Disclosure or accordion.** A disclosure is one button and one region. An
accordion is several, and the open question there is whether opening one closes
the others, and whether the headers are a composite widget with arrow key
navigation. Those are different patterns with different keyboard models. This
repository implements the disclosure, and a group of disclosures composed
together is still a group of disclosures, not an accordion.

**Toast: dismissal.** There is no correct auto dismiss duration, which is why
the component here does not auto dismiss at all. WCAG 2.2.1 Timing Adjustable
has no exception that covers a four second toast: a time limit on reading a
message is a time limit. If the information remains available somewhere else,
an auto dismissing copy of it is defensible, and that is a judgement about the
product rather than about the component.

**Toast: politeness.** `role="status"` for everything, with `role="alert"` kept
for the cases that genuinely justify interrupting whatever the screen reader is
currently saying. The failure mode in both directions is real: everything
assertive makes the page unusable, and a payment failure announced politely may
never be heard. The component takes the urgency as a prop and defaults to
polite.
