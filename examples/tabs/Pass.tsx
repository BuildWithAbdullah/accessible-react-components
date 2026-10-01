/**
 * Tabs, corrected. Roles, one roving tab stop, arrows and Home and End, and
 * every panel named by its tab.
 */
import { Tabs } from '../../src/components/Tabs.js';

export default function Example() {
  return (
    <Tabs
      label="Product information"
      tabs={[
        { id: 'overview', label: 'Overview', content: 'What the product does.' },
        { id: 'pricing', label: 'Pricing', content: 'What the product costs.' },
        { id: 'support', label: 'Support', content: 'How to get help.' },
      ]}
    />
  );
}
