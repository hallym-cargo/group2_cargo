import { useEffect, useRef, useState } from "react";

const STATUS_OPTIONS = ["전체", "모집중", "배차완료", "운송중", "운송완료"];

export default function StatusSelect({ value, onChange }) {
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
    <div className="custom-select" ref={containerRef}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{value || "전체"}</span>
        <span className="custom-select-arrow">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="custom-select-dropdown">
          {STATUS_OPTIONS.map((option) => (
            <button
              type="button"
              key={option}
              className={`custom-select-option ${
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
