export function Dropdown({ title, onChange, options }) {
    return (
      <label
        style={{
          margin: "1em",
          display: "flex",
          justifyContent: "center",
          gap: ".5em"
        }}
      >
        {title}
        <select name="sort" id="sort-select" onChange={onChange}>
          {options.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    );
  }
