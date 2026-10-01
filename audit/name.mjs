/**
 * Enough of the accessible name computation to tell a labelled control from an
 * unlabelled one.
 *
 * This is deliberately a subset: aria-label, then aria-labelledby, then the
 * text content with aria-hidden subtrees removed, then the title attribute,
 * then alt text on a lone image. It does not implement the full accname
 * algorithm, so a name it reports is a name, and a name it does not report is
 * not proof that the control has none. What it is reliable for is the case
 * this repository cares about: an icon button whose only content is a glyph
 * marked aria-hidden, which computes to nothing.
 */
export function accessibleName(el) {
  if (!el) return '';

  const label = el.getAttribute('aria-label');
  if (label && label.trim()) return label.trim();

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id))
      .filter(Boolean)
      .map((node) => visibleText(node))
      .join(' ')
      .trim();
    if (text) return text;
  }

  if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
    const id = el.getAttribute('id');
    if (id) {
      const native = el.ownerDocument.querySelector(`label[for="${id}"]`);
      if (native) {
        const text = visibleText(native);
        if (text) return text;
      }
    }
  }

  const text = visibleText(el);
  if (text) return text;

  const title = el.getAttribute('title');
  if (title && title.trim()) return title.trim();

  const img = el.querySelector('img[alt]');
  if (img) {
    const alt = img.getAttribute('alt');
    if (alt && alt.trim()) return alt.trim();
  }

  return '';
}

function visibleText(node) {
  let out = '';
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      out += child.nodeValue;
      continue;
    }
    if (child.nodeType !== 1) continue;
    if (child.getAttribute('aria-hidden') === 'true') continue;
    if (child.hasAttribute('hidden')) continue;
    out += visibleText(child);
  }
  return out.replace(/\s+/g, ' ').trim();
}
