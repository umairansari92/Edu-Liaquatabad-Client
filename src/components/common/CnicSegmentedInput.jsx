import React, { useRef } from 'react';

/**
 * CnicSegmentedInput
 * Displays 15 individual digit boxes formatted as:
 * [0][0][0][0][0] - [0][0][0][0][0][0][0] - [0]
 * Matches official TMC paper admission form layout.
 */
export const CnicSegmentedInput = ({ value = '', onChange, disabled = false, hasError = false }) => {
  const inputRefs = useRef([]);

  // Normalize string of 13 digits or formatted XXXXX-XXXXXXX-X
  const rawDigits = (value || '').replace(/\D/g, '').slice(0, 13);

  const updateDigit = (index, char) => {
    const currentChars = rawDigits.padEnd(13, ' ').split('');
    currentChars[index] = char;
    const newRaw = currentChars.join('').replace(/ /g, '');
    
    // Format to XXXXX-XXXXXXX-X when long enough or keep raw
    let formatted = newRaw;
    if (newRaw.length > 5 && newRaw.length <= 12) {
      formatted = `${newRaw.slice(0, 5)}-${newRaw.slice(5)}`;
    } else if (newRaw.length > 12) {
      formatted = `${newRaw.slice(0, 5)}-${newRaw.slice(5, 12)}-${newRaw.slice(12, 13)}`;
    }
    onChange?.(formatted);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!rawDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        updateDigit(index, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 12) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleInput = (index, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    if (char) {
      updateDigit(index, char);
      if (index < 12) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 13);
    if (pasted) {
      let formatted = pasted;
      if (pasted.length >= 13) {
        formatted = `${pasted.slice(0, 5)}-${pasted.slice(5, 12)}-${pasted.slice(12, 13)}`;
      } else if (pasted.length > 5) {
        formatted = `${pasted.slice(0, 5)}-${pasted.slice(5)}`;
      }
      onChange?.(formatted);
      const nextFocus = Math.min(pasted.length, 12);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const renderBox = (index) => {
    const digitChar = rawDigits[index] || '';
    return (
      <input
        key={index}
        ref={(el) => (inputRefs.current[index] = el)}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={digitChar}
        disabled={disabled}
        onChange={(e) => handleInput(index, e)}
        onKeyDown={(e) => handleKeyDown(index, e)}
        onPaste={handlePaste}
        className={`w-6 h-8 sm:w-7 sm:h-9 text-center font-mono text-xs sm:text-sm font-bold rounded border transition-all focus:outline-none ${
          hasError
            ? 'border-rose-400 bg-rose-50 text-rose-800 focus:ring-2 focus:ring-rose-400'
            : 'border-slate-300 bg-white text-[#102033] focus:border-[#006AC7] focus:ring-2 focus:ring-blue-100 shadow-2xs'
        }`}
      />
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 select-none" onPaste={handlePaste}>
      {/* 5 digits: Area/Province/Division */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {[0, 1, 2, 3, 4].map(renderBox)}
      </div>

      <span className="text-slate-400 font-bold text-sm select-none px-0.5">-</span>

      {/* 7 digits: Family sequence */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {[5, 6, 7, 8, 9, 10, 11].map(renderBox)}
      </div>

      <span className="text-slate-400 font-bold text-sm select-none px-0.5">-</span>

      {/* 1 digit: Gender indicator (odd = male, even = female) */}
      <div className="flex items-center">
        {[12].map(renderBox)}
      </div>
    </div>
  );
};

export default CnicSegmentedInput;
