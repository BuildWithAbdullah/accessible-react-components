/**
 * Mount a React element into a fresh jsdom document and hand back the
 * container plus an act wrapped update and unmount.
 */
import { installDom } from './_dom.mjs';

const dom = installDom();

const { createElement, act } = await import('react');
const { createRoot } = await import('react-dom/client');

export { createElement, act };
export const win = dom.window;
export const doc = dom.window.document;

export async function mount(Component, props = {}) {
  const host = doc.createElement('div');
  doc.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(createElement(Component, props));
  });
  return {
    host,
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      host.remove();
    },
  };
}
