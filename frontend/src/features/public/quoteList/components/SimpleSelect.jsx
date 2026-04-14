import { useEffect, useRef, useState } from "react";

export default function SimpleSelect({
  value,
  options,
  onChange,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div className={`simple-select ${className}`.trim()} ref={containerRef}>
      <button
        type="button"
        className="simple-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{value}</span>
        <span className="simple-select-arrow">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="simple-select-dropdown">
          {options.map((option) => (
            <button
              type="button"
              key={option}
              className={`simple-select-option ${
                value === option ? "active" : ""
              }`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
