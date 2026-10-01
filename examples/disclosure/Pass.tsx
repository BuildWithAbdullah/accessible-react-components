/**
 * Disclosure, corrected. A button carrying aria-expanded and aria-controls,
 * and a region taken out of the tab order with the hidden attribute.
 */
import { Disclosure } from '../../src/components/Disclosure.js';

export default function Example() {
  return (
    <Disclosure label="Delivery options">
      <p>Standard delivery takes three working days.</p>
      <a href="/delivery">Read the delivery policy</a>
    </Disclosure>
  );
}
