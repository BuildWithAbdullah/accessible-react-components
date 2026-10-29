/**
 * One constructed case per finding the six example pairs never reach.
 *
 * The pairs are whole, plausible components: a defect arrives in a pull
 * request looking like a component, so that is what the pairs are. The
 * consequence is that each pair reaches whichever reason its own defect
 * happens to be, and the other reasons in the same audit are never run. The
 * pairs reach 26 of the 69 findings in audit/findings.mjs. These cases reach
 * the other 43.
 *
 * Each case is the smallest markup that reaches exactly one finding, and
 * test/findings.test.mjs asserts that it reaches that one and no other. They
 * are deliberately not pretty: they exist to drive a branch, and several of
 * them are markup nobody would write on purpose.
 *
 * Every defect found by writing this file is recorded in docs/04-defects.md.
 */
import { createElement as h, act } from './_render.mjs';

const { useState, useRef } = await import('react');

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

/** aria-controls naming an id that is not in the document. */
function DanglingControls() {
  return h('div', { className: 'fx' }, [
    h(
      'button',
      { key: 'b', className: 'fx-trigger', 'aria-expanded': 'false', 'aria-controls': 'fx-not-here' },
      'Details',
    ),
    h('div', { key: 'r', id: 'fx-region', className: 'fx-region' }, 'Body'),
  ]);
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

function dialogShell(panelProps, children, extra = []) {
  return h('div', { className: 'fx' }, [
    h('button', { key: 't', 'data-arc-trigger': true }, 'Open'),
    h(
      'div',
      { key: 'p', className: 'fx-panel', 'aria-labelledby': 'fx-dialog-title', ...panelProps },
      [h('h2', { key: 'h', id: 'fx-dialog-title' }, 'Settings'), ...children],
    ),
    ...extra,
  ]);
}

/** role and name present, aria-modal absent. */
function DialogNotModal() {
  return dialogShell({ role: 'dialog' }, [
    h('button', { key: 'c', className: 'fx-close' }, 'Close'),
  ]);
}

/** A correct looking modal with nothing focusable in it. */
function DialogNothingTabbable() {
  return dialogShell({ role: 'dialog', 'aria-modal': 'true' }, [
    h('p', { key: 'p' }, 'Saved.'),
  ]);
}

/**
 * Tab is claimed in both directions and the forward target is outside the
 * panel. Somebody wrote a trap; it sends focus out of the dialog.
 */
function DialogTabEscapesForward() {
  const outside = useRef(null);
  const first = useRef(null);
  const onKeyDown = (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    if (event.shiftKey) first.current?.focus();
    else outside.current?.focus();
  };
  return h('div', { className: 'fx' }, [
    h('button', { key: 't', 'data-arc-trigger': true }, 'Open'),
    h(
      'div',
      {
        key: 'p',
        className: 'fx-panel',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'fx-dialog-title',
        onKeyDown,
      },
      [
        h('h2', { key: 'h', id: 'fx-dialog-title' }, 'Settings'),
        h('button', { key: 'a', ref: first, className: 'fx-close' }, 'Close'),
        h('button', { key: 'b' }, 'Save'),
      ],
    ),
    h('button', { key: 'o', ref: outside }, 'Behind the overlay'),
  ]);
}

/** Forward containment written, shiftKey never considered. */
function DialogTabNotClaimedBackward() {
  const first = useRef(null);
  const onKeyDown = (event) => {
    if (event.key !== 'Tab' || event.shiftKey) return;
    event.preventDefault();
    first.current?.focus();
  };
  return h('div', { className: 'fx' }, [
    h('button', { key: 't', 'data-arc-trigger': true }, 'Open'),
    h(
      'div',
      {
        key: 'p',
        className: 'fx-panel',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'fx-dialog-title',
        onKeyDown,
      },
      [
        h('h2', { key: 'h', id: 'fx-dialog-title' }, 'Settings'),
        h('button', { key: 'a', ref: first, className: 'fx-close' }, 'Close'),
        h('button', { key: 'b' }, 'Save'),
      ],
    ),
    h('button', { key: 'o' }, 'Behind the overlay'),
  ]);
}

/** Both directions claimed, the backward target is outside. */
function DialogTabEscapesBackward() {
  const outside = useRef(null);
  const first = useRef(null);
  const onKeyDown = (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    if (event.shiftKey) outside.current?.focus();
    else first.current?.focus();
  };
  return h('div', { className: 'fx' }, [
    h('button', { key: 't', 'data-arc-trigger': true }, 'Open'),
    h(
      'div',
      {
        key: 'p',
        className: 'fx-panel',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'fx-dialog-title',
        onKeyDown,
      },
      [
        h('h2', { key: 'h', id: 'fx-dialog-title' }, 'Settings'),
        h('button', { key: 'a', ref: first, className: 'fx-close' }, 'Close'),
        h('button', { key: 'b' }, 'Save'),
      ],
    ),
    h('button', { key: 'o', ref: outside }, 'Behind the overlay'),
  ]);
}

// ---------------------------------------------------------------------------
// Disclosure
// ---------------------------------------------------------------------------

/** aria-expanded set once in the closed markup and never derived from state. */
function DisclosureStateNotUpdated() {
  const [open, setOpen] = useState(false);
  return h('div', { className: 'fx' }, [
    h(
      'button',
      {
        key: 'b',
        className: 'fx-trigger',
        'aria-expanded': 'false',
        'aria-controls': 'fx-region',
        onClick: () => setOpen((value) => !value),
      },
      'Details',
    ),
    h(
      'div',
      { key: 'r', id: 'fx-region', className: 'fx-region', hidden: !open },
      h('button', null, 'Inside'),
    ),
  ]);
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const TAB_LABELS = ['Overview', 'Billing', 'Members'];

function tabStrip(items, panelProps = {}, panelExtra = []) {
  return h('div', { className: 'fx' }, [
    h('div', { key: 'l', role: 'tablist', className: 'fx-tablist' }, items),
    h(
      'div',
      { key: 'p', role: 'tabpanel', id: 'fx-panel-0', ...panelProps },
      'Panel',
    ),
    ...panelExtra,
  ]);
}

/** Three items in the strip, one of which is not a tab. */
function TabsItemsNotTabs() {
  return tabStrip(
    [
      h('button', { key: 0, role: 'tab', className: 'tab', 'aria-selected': 'true', tabIndex: 0 }, TAB_LABELS[0]),
      h('button', { key: 1, role: 'tab', className: 'tab', 'aria-selected': 'false', tabIndex: -1 }, TAB_LABELS[1]),
      h('button', { key: 2, className: 'tab', tabIndex: -1 }, TAB_LABELS[2]),
    ],
    { 'aria-labelledby': 'fx-tab-0' },
  );
}

/** A tablist of real tabs with no panel anywhere. */
function TabsNoPanel() {
  return h('div', { className: 'fx' }, [
    h('div', { key: 'l', role: 'tablist', className: 'fx-tablist' }, [
      h('button', { key: 0, role: 'tab', className: 'tab', 'aria-selected': 'true', tabIndex: 0 }, TAB_LABELS[0]),
      h('button', { key: 1, role: 'tab', className: 'tab', 'aria-selected': 'false', tabIndex: -1 }, TAB_LABELS[1]),
    ]),
    h('div', { key: 'c' }, 'Panel content with no role'),
  ]);
}

/** A roving tabindex rolled to -1 everywhere, so the strip is unreachable. */
function TabsNoTabStop() {
  return tabStrip([
    h('button', { key: 0, role: 'tab', className: 'tab', 'aria-selected': 'true', tabIndex: -1 }, TAB_LABELS[0]),
    h('button', { key: 1, role: 'tab', className: 'tab', 'aria-selected': 'false', tabIndex: -1 }, TAB_LABELS[1]),
  ]);
}

/** Selection exposed, no key handler at all. */
function TabsArrowsDead() {
  return tabStrip([
    h('button', { key: 0, role: 'tab', className: 'tab', 'aria-selected': 'true', tabIndex: 0 }, TAB_LABELS[0]),
    h('button', { key: 1, role: 'tab', className: 'tab', 'aria-selected': 'false', tabIndex: -1 }, TAB_LABELS[1]),
  ]);
}

/**
 * A tab strip whose key handling is described by `keys`: which keys move the
 * selection, and whether focus goes with it. Every remaining tabs case is a
 * configuration of this one component.
 */
function makeTabs({ handled, moveFocus }) {
  return function Tabs() {
    const [selected, setSelected] = useState(0);
    const refs = useRef([]);
    const go = (next) => {
      setSelected(next);
      if (moveFocus) {
        // The focus call has to happen after React has rendered the new
        // tabindex, which act() flushes around the event this runs inside.
        queueMicrotask(() => refs.current[next]?.focus());
      }
    };
    const onKeyDown = (event) => {
      const last = TAB_LABELS.length - 1;
      if (!handled.includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowRight') go(Math.min(selected + 1, last));
      if (event.key === 'ArrowLeft') go(Math.max(selected - 1, 0));
      if (event.key === 'End') go(last);
      if (event.key === 'Home') go(0);
    };
    return h('div', { className: 'fx' }, [
      h(
        'div',
        { key: 'l', role: 'tablist', className: 'fx-tablist', onKeyDown },
        TAB_LABELS.map((label, index) =>
          h(
            'button',
            {
              key: index,
              id: `fx-tab-${index}`,
              ref: (node) => {
                refs.current[index] = node;
              },
              role: 'tab',
              className: 'tab',
              'aria-selected': index === selected ? 'true' : 'false',
              'aria-controls': 'fx-panel-0',
              tabIndex: index === selected ? 0 : -1,
            },
            label,
          ),
        ),
      ),
      h(
        'div',
        {
          key: 'p',
          role: 'tabpanel',
          id: 'fx-panel-0',
          'aria-labelledby': `fx-tab-${selected}`,
        },
        'Panel',
      ),
    ]);
  };
}

/** The panel points at its heading rather than at its tab. */
function TabsPanelLabelledByNonTab() {
  return h('div', { className: 'fx' }, [
    h('h2', { key: 'h', id: 'fx-heading' }, 'Overview'),
    h('div', { key: 'l', role: 'tablist', className: 'fx-tablist' }, [
      h(
        'button',
        {
          key: 0,
          id: 'fx-tab-0',
          role: 'tab',
          className: 'tab',
          'aria-selected': 'true',
          'aria-controls': 'fx-panel-0',
          tabIndex: 0,
        },
        TAB_LABELS[0],
      ),
      h('button', { key: 1, role: 'tab', className: 'tab', 'aria-selected': 'false', tabIndex: -1 }, TAB_LABELS[1]),
    ]),
    h(
      'div',
      { key: 'p', role: 'tabpanel', id: 'fx-panel-0', 'aria-labelledby': 'fx-heading' },
      'Panel',
    ),
  ]);
}

/** One panel, labelled from a fixed id, while the second tab is selected. */
function TabsPanelLabelledByWrongTab() {
  return h('div', { className: 'fx' }, [
    h('div', { key: 'l', role: 'tablist', className: 'fx-tablist' }, [
      h(
        'button',
        {
          key: 0,
          id: 'fx-tab-0',
          role: 'tab',
          className: 'tab',
          'aria-selected': 'false',
          'aria-controls': 'fx-panel-0',
          tabIndex: -1,
        },
        TAB_LABELS[0],
      ),
      h(
        'button',
        {
          key: 1,
          id: 'fx-tab-1',
          role: 'tab',
          className: 'tab',
          'aria-selected': 'true',
          'aria-controls': 'fx-panel-0',
          tabIndex: 0,
        },
        TAB_LABELS[1],
      ),
    ]),
    h(
      'div',
      { key: 'p', role: 'tabpanel', id: 'fx-panel-0', 'aria-labelledby': 'fx-tab-0' },
      'Panel',
    ),
  ]);
}

/** The pair of attributes points in a circle that does not close. */
function TabsControlsWrongPanel() {
  return h('div', { className: 'fx' }, [
    h('div', { key: 'l', role: 'tablist', className: 'fx-tablist' }, [
      h(
        'button',
        {
          key: 0,
          id: 'fx-tab-0',
          role: 'tab',
          className: 'tab',
          'aria-selected': 'true',
          'aria-controls': 'fx-stale-panel',
          tabIndex: 0,
        },
        TAB_LABELS[0],
      ),
      h('button', { key: 1, role: 'tab', className: 'tab', 'aria-selected': 'false', tabIndex: -1 }, TAB_LABELS[1]),
    ]),
    h(
      'div',
      { key: 'p', role: 'tabpanel', id: 'fx-panel-0', 'aria-labelledby': 'fx-tab-0' },
      'Panel',
    ),
    h('div', { key: 's', id: 'fx-stale-panel' }, 'A panel from an earlier version'),
  ]);
}

// ---------------------------------------------------------------------------
// Combobox
// ---------------------------------------------------------------------------

const OPTIONS = ['Apricot', 'Almond', 'Banana'];

function comboShell({ inputProps = {}, listProps = {}, optionProps = () => ({}), wrap = false }) {
  const options = OPTIONS.map((label, index) =>
    h(
      'li',
      { key: index, id: `fx-opt-${index}`, className: 'fx-option', ...optionProps(index) },
      label,
    ),
  );
  const list = h('ul', { key: 'l', id: 'fx-list', className: 'fx-list', ...listProps }, options);
  return h('div', { className: 'fx' }, [
    h(
      'input',
      {
        key: 'i',
        type: 'text',
        'aria-label': 'Fruit',
        role: 'combobox',
        'aria-expanded': 'true',
        'aria-controls': 'fx-list',
        ...inputProps,
      },
    ),
    wrap ? h('div', { key: 'w', id: 'fx-wrap' }, list) : list,
  ]);
}

/** Rows with option roles inside a container that is not a listbox. */
function ComboNoListbox() {
  return comboShell({ optionProps: () => ({ role: 'option' }) });
}

/** A listbox whose rows carry no role. */
function ComboNoOptions() {
  return comboShell({ listProps: { role: 'listbox' } });
}

/** aria-expanded present, false, and never derived from state. */
function ComboOpenStateNotExposed() {
  return comboShell({
    inputProps: { 'aria-expanded': 'false' },
    listProps: { role: 'listbox' },
    optionProps: () => ({ role: 'option' }),
  });
}

/** The virtual cursor pointed at the row wrapper rather than at the option. */
function ComboActiveDescendantNotAnOption() {
  return comboShell({
    inputProps: { 'aria-activedescendant': 'fx-wrap' },
    listProps: { role: 'listbox' },
    optionProps: () => ({ role: 'option' }),
    wrap: true,
  });
}

/** An active index that is set rather than advanced. */
function ComboActiveDescendantDoesNotAdvance() {
  return comboShell({
    inputProps: { 'aria-activedescendant': 'fx-opt-0' },
    listProps: { role: 'listbox' },
    optionProps: (index) => ({ role: 'option', 'aria-selected': index === 0 ? 'true' : 'false' }),
  });
}

/** The menu focus model wearing a combobox role. */
function ComboFocusLeavesTheInput() {
  const first = useRef(null);
  return h('div', { className: 'fx' }, [
    h('input', {
      key: 'i',
      type: 'text',
      'aria-label': 'Fruit',
      role: 'combobox',
      'aria-expanded': 'true',
      'aria-controls': 'fx-list',
      'aria-activedescendant': 'fx-opt-0',
      onKeyDown: (event) => {
        if (event.key === 'ArrowDown') first.current?.focus();
      },
    }),
    h('ul', { key: 'l', id: 'fx-list', role: 'listbox' }, [
      h(
        'li',
        {
          key: 0,
          id: 'fx-opt-0',
          ref: first,
          role: 'option',
          'aria-selected': 'true',
          tabIndex: -1,
        },
        OPTIONS[0],
      ),
      h('li', { key: 1, id: 'fx-opt-1', role: 'option', 'aria-selected': 'false' }, OPTIONS[1]),
    ]),
  ]);
}

/**
 * A combobox whose Enter and Escape behaviour is described by `on`. Every
 * remaining combobox case is a configuration of this one component.
 */
function makeCombo({ onEnter, onEscape }) {
  return function Combo() {
    const [open, setOpen] = useState(true);
    const [hidden, setHidden] = useState(false);
    const input = useRef(null);
    const onKeyDown = (event) => {
      if (event.key === 'Enter') {
        if (onEnter === 'commit-and-close') {
          input.current.value = OPTIONS[0];
          setOpen(false);
        }
        if (onEnter === 'commit-only') input.current.value = OPTIONS[0];
      }
      if (event.key === 'Escape') {
        if (onEscape === 'clear') {
          input.current.value = '';
          setOpen(false);
          setHidden(true);
        }
        if (onEscape === 'close-but-leave-options') setOpen(false);
        if (onEscape === 'close') {
          setOpen(false);
          setHidden(true);
        }
      }
    };
    return h('div', { className: 'fx' }, [
      h('input', {
        key: 'i',
        ref: input,
        type: 'text',
        'aria-label': 'Fruit',
        role: 'combobox',
        'aria-expanded': open ? 'true' : 'false',
        'aria-controls': 'fx-list',
        'aria-activedescendant': 'fx-opt-0',
        onKeyDown,
      }),
      h('ul', { key: 'l', id: 'fx-list', role: 'listbox', hidden }, [
        h('li', { key: 0, id: 'fx-opt-0', role: 'option', 'aria-selected': 'true' }, OPTIONS[0]),
        h('li', { key: 1, id: 'fx-opt-1', role: 'option', 'aria-selected': 'false' }, OPTIONS[1]),
      ]),
    ]);
  };
}

// ---------------------------------------------------------------------------
// Menu button
// ---------------------------------------------------------------------------

const MENU_LABELS = ['Duplicate', 'Export', 'Delete'];

/**
 * A menu button whose keyboard handling is described by `handled` and
 * `onEscape`. The popup is always mounted and `open` only hides it, which is
 * how the shipped component works and why the audits count exposed items
 * rather than elements.
 */
function makeMenu({ open = true, haspopup = 'menu', expanded = true, menuRole = 'menu', itemRole = 'menuitem', focusFirstOnArrowDown = false, handled = [], onEscape = 'nothing' }) {
  return function Menu() {
    const [isOpen, setOpen] = useState(open);
    const items = useRef([]);
    const button = useRef(null);
    const focusIndex = (index) => items.current[index]?.focus();
    const onButtonKeyDown = (event) => {
      if (event.key !== 'ArrowDown') return;
      event.preventDefault();
      setOpen(true);
      if (focusFirstOnArrowDown) queueMicrotask(() => focusIndex(0));
    };
    const onItemKeyDown = (event) => {
      const current = items.current.findIndex((node) => node === event.target);
      const last = MENU_LABELS.length - 1;
      if (event.key === 'Escape') {
        if (onEscape === 'nothing') return;
        event.preventDefault();
        setOpen(false);
        if (onEscape === 'close-and-return') queueMicrotask(() => button.current?.focus());
        return;
      }
      if (!handled.includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowDown') focusIndex(Math.min(current + 1, last));
      if (event.key === 'ArrowUp') focusIndex(Math.max(current - 1, 0));
      if (event.key === 'End') focusIndex(last);
      if (event.key === 'Home') focusIndex(0);
    };
    const buttonProps = {
      key: 'b',
      ref: button,
      className: 'fx-menu-button',
      onKeyDown: onButtonKeyDown,
      onClick: () => setOpen(true),
    };
    if (haspopup !== null) buttonProps['aria-haspopup'] = haspopup;
    if (expanded !== null) buttonProps['aria-expanded'] = isOpen ? 'true' : 'false';
    const listProps = { key: 'm', className: 'fx-menu', hidden: !isOpen };
    if (menuRole !== null) listProps.role = menuRole;
    return h('div', { className: 'fx' }, [
      h('button', buttonProps, 'Actions'),
      h(
        'ul',
        listProps,
        MENU_LABELS.map((label, index) => {
          const props = {
            key: index,
            className: 'fx-menuitem',
            tabIndex: -1,
            onKeyDown: onItemKeyDown,
            ref: (node) => {
              items.current[index] = node;
            },
          };
          if (itemRole !== null) props.role = itemRole;
          return h('li', props, label);
        }),
      ),
    ]);
  };
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

const MESSAGE = 'Profile saved';

/** An empty region stays empty and the message arrives in a new one. */
function ToastMessageInANewRegion() {
  const [shown, setShown] = useState(false);
  return h('div', { className: 'fx' }, [
    h('button', { key: 't', 'data-arc-trigger': true, onClick: () => setShown(true) }, 'Save'),
    h('div', { key: 'r', role: 'status', className: 'fx-region' }),
    shown
      ? h('div', { key: 'n', role: 'alert', className: 'fx-new-region' }, [
          MESSAGE,
          h('button', { key: 'd', className: 'fx-dismiss' }, 'Dismiss'),
        ])
      : null,
  ]);
}

/** A region, a trigger, and nothing wired between them. */
function ToastMessageNeverAppears() {
  return h('div', { className: 'fx' }, [
    h('button', { key: 't', 'data-arc-trigger': true }, 'Save'),
    h('div', { key: 'r', role: 'status', className: 'fx-region' }),
  ]);
}

/** The region is mounted and empty, and the message renders beside it. */
function ToastMessageOutsideTheRegion() {
  const [shown, setShown] = useState(false);
  return h('div', { className: 'fx' }, [
    h('button', { key: 't', 'data-arc-trigger': true, onClick: () => setShown(true) }, 'Save'),
    h('div', { key: 'r', role: 'status', className: 'fx-region' }),
    shown ? h('p', { key: 'm', className: 'fx-visual' }, MESSAGE) : null,
  ]);
}

/** A named dismiss control that is not a button. */
function ToastDismissNotAButton() {
  const [shown, setShown] = useState(false);
  return h('div', { className: 'fx' }, [
    h('button', { key: 't', 'data-arc-trigger': true, onClick: () => setShown(true) }, 'Save'),
    h('div', { key: 'r', role: 'status', className: 'fx-region' }, [
      shown ? MESSAGE : '',
      shown
        ? h('span', { key: 'd', className: 'fx-dismiss', role: 'button', tabIndex: 0 }, 'Dismiss')
        : null,
    ]),
  ]);
}

export {
  act,
  DanglingControls,
  DialogNotModal,
  DialogNothingTabbable,
  DialogTabEscapesForward,
  DialogTabNotClaimedBackward,
  DialogTabEscapesBackward,
  DisclosureStateNotUpdated,
  TabsItemsNotTabs,
  TabsNoPanel,
  TabsNoTabStop,
  TabsArrowsDead,
  makeTabs,
  TabsPanelLabelledByNonTab,
  TabsPanelLabelledByWrongTab,
  TabsControlsWrongPanel,
  ComboNoListbox,
  ComboNoOptions,
  ComboOpenStateNotExposed,
  ComboActiveDescendantNotAnOption,
  ComboActiveDescendantDoesNotAdvance,
  ComboFocusLeavesTheInput,
  makeCombo,
  makeMenu,
  ToastMessageInANewRegion,
  ToastMessageNeverAppears,
  ToastMessageOutsideTheRegion,
  ToastDismissNotAButton,
  MESSAGE,
};
