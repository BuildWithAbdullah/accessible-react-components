/**
 * Tabs, the version that ships.
 *
 *  - divs with click handlers, so no tab, tablist or tabpanel role
 *  - every strip item carries tabIndex 0, so a three tab strip is three tab
 *    stops and a twelve tab strip is twelve
 *  - the arrow keys do nothing
 *  - the panel is not named by the tab, and the selected state is carried by a
 *    class name only
 */
import { useState } from 'react';

const PANELS = [
  { label: 'Overview', body: 'What the product does.' },
  { label: 'Pricing', body: 'What the product costs.' },
  { label: 'Support', body: 'How to get help.' },
];

export default function Example() {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <div className="tabstrip">
        {PANELS.map((panel, index) => (
          <div
            key={panel.label}
            className={index === selected ? 'tab tab-active' : 'tab'}
            tabIndex={0}
            onClick={() => setSelected(index)}
          >
            {panel.label}
          </div>
        ))}
      </div>
      <div className="tabbody">{PANELS[selected]?.body}</div>
    </div>
  );
}
