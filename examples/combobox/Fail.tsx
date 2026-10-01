/**
 * Combobox, the version that ships.
 *
 * A text field with a filtered list under it, which is what the design asked
 * for and what the ticket said.
 *
 *  - no combobox role and no aria-expanded, so nothing says a list appeared
 *  - the list is a plain ul, so it is not a listbox and the rows are not
 *    options
 *  - the arrow keys do nothing: selection is mouse only
 *  - no aria-activedescendant, so the highlighted row is a background colour
 *    and nothing more
 */
import { useState } from 'react';

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Peshawar', 'Quetta', 'Multan'];

export default function Example() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const matches = CITIES.filter((city) =>
    city.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="autocomplete">
      <label htmlFor="fail-city">City</label>
      <input
        id="fail-city"
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
      />
      {open ? (
        <ul className="suggestions">
          {matches.map((city) => (
            <li
              key={city}
              className="suggestion"
              onClick={() => {
                setQuery(city);
                setOpen(false);
              }}
            >
              {city}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
