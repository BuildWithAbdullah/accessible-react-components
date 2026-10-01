/**
 * Toast, corrected. Both live regions are mounted from the first render and
 * sit empty, the message is a text change inside an observed region, focus
 * never moves, dismissal is a labelled button, and nothing disappears on a
 * timer.
 */
import { useState } from 'react';
import { ToastRegion } from '../../src/components/ToastRegion.js';
import type { ToastMessage } from '../../src/components/ToastRegion.js';

export default function Example() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  return (
    <div>
      <button
        type="button"
        data-arc-trigger="notify"
        onClick={() =>
          setMessages((list) => [...list, { id: `m${list.length}`, text: 'Profile saved' }])
        }
      >
        Save
      </button>
      <ToastRegion
        messages={messages}
        onDismiss={(id) => setMessages((list) => list.filter((m) => m.id !== id))}
      />
    </div>
  );
}
