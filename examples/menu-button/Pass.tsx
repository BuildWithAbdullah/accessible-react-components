/**
 * Menu button, corrected. aria-haspopup and aria-expanded on the button, a
 * real menu with menuitem children, DOM focus moved into the menu, Escape
 * closing it and handing focus back.
 */
import { MenuButton } from '../../src/components/MenuButton.js';

export default function Example() {
  return (
    <MenuButton
      label="Actions"
      items={[{ label: 'Duplicate' }, { label: 'Export' }, { label: 'Archive' }]}
    />
  );
}
