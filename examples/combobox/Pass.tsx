/**
 * Combobox, corrected. Roles and state on the input, a real listbox, arrow
 * keys moving aria-activedescendant while DOM focus stays in the field.
 */
import { Combobox } from '../../src/components/Combobox.js';

export default function Example() {
  return (
    <Combobox
      label="City"
      options={['Lahore', 'Karachi', 'Islamabad', 'Peshawar', 'Quetta', 'Multan']}
    />
  );
}
