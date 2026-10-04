import React, { useState } from 'react';

const evaluateArithmetic = source => {
  const expression = source.trim().replace(/^=/, '').replace(/\s+/g, '');
  const tokens = expression.match(/(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[()+\-*/]/g) || [];
  if (!expression || tokens.join('') !== expression) throw new Error('Enter a valid arithmetic formula');

  let position = 0;
  const parseFactor = () => {
    const token = tokens[position++];
    if (token === '+') return parseFactor();
    if (token === '-') return -parseFactor();
    if (token === '(') {
      const result = parseExpression();
      if (tokens[position++] !== ')') throw new Error('Missing closing parenthesis');
      return result;
    }
    const result = Number(token);
    if (!token || !Number.isFinite(result)) throw new Error('Expected a number');
    return result;
  };
  const parseTerm = () => {
    let result = parseFactor();
    while (tokens[position] === '*' || tokens[position] === '/') {
      const operator = tokens[position++];
      const next = parseFactor();
      if (operator === '/' && next === 0) throw new Error('Cannot divide by zero');
      result = operator === '*' ? result * next : result / next;
    }
    return result;
  };
  const parseExpression = () => {
    let result = parseTerm();
    while (tokens[position] === '+' || tokens[position] === '-') {
      const operator = tokens[position++];
      const next = parseTerm();
      result = operator === '+' ? result + next : result - next;
    }
    return result;
  };

  const result = parseExpression();
  if (position !== tokens.length || !Number.isFinite(result)) throw new Error('Enter a valid arithmetic formula');
  if (result < 0) throw new Error('Value cannot be negative');
  return String(Number(result.toFixed(6)));
};

export const CalculatorInput = ({ value, onChange, onKeyDown, ...inputProps }) => {
  const controlledValue = String(value ?? '');
  const [draftState, setDraftState] = useState({ source: controlledValue, draft: controlledValue });
  const [formulaError, setFormulaError] = useState('');
  const draft = draftState.source === controlledValue ? draftState.draft : controlledValue;

  const handleChange = event => {
    const nextValue = event.target.value;
    setDraftState({ source: controlledValue, draft: nextValue });
    setFormulaError('');
    if (!nextValue.trim().startsWith('=')) {
      if (/^\s*-/.test(nextValue)) {
        setFormulaError('Value cannot be negative');
        return;
      }
      onChange?.(nextValue);
    }
  };

  const handleKeyDown = event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== 'Enter' || !draft.trim().startsWith('=')) return;
    event.preventDefault();
    try {
      const result = evaluateArithmetic(draft);
      setDraftState({ source: controlledValue, draft: result });
      setFormulaError('');
      onChange?.(result);
    } catch (error) {
      setFormulaError(error.message || 'Enter a valid arithmetic formula');
    }
  };

  return (
    <span style={{ display: 'block' }}>
      <input
        {...inputProps}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        title="Type = followed by a calculation, then press Enter"
        aria-invalid={Boolean(formulaError)}
      />
      {formulaError && <small role="alert" style={{ color: 'var(--color-danger, #dc2626)' }}>{formulaError}</small>}
    </span>
  );
};
