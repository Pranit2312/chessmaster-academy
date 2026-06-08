import React, { useState } from 'react';
import { SAMPLE_PGN, validatePgn } from '../../utils/pgnHelpers';

const PgnUploader = ({ onSubmit, submitting, error }) => {
  const [pgn, setPgn] = useState('');
  const [depth, setDepth] = useState(12);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validatePgn(pgn);
    if (!validation.valid) {
      setLocalError(validation.message);
      return;
    }
    setLocalError('');
    onSubmit(validation.normalized, depth);
  };

  return (
    <form className="pgn-uploader" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="pgn">Paste your PGN</label>
        <textarea
          id="pgn"
          rows={12}
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
          placeholder="Paste full PGN from Chess.com or Lichess, e.g. 1. e4 e5 2. Nf3 Nc6 ..."
          required
        />
        <p className="pgn-hint-text">
          Tip: Use &quot;Load sample game&quot; or export PGN from your chess app. Shorthand like <code>e4 e5</code> also works.
        </p>
        <button
          type="button"
          className="btn btn-text"
          onClick={() => setPgn(SAMPLE_PGN)}
        >
          Load sample game
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="depth">Analysis depth</label>
        <select id="depth" value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
          <option value={10}>10 — Fast</option>
          <option value={12}>12 — Balanced</option>
          <option value={15}>15 — Deep</option>
          <option value={20}>20 — Very deep</option>
        </select>
      </div>

      {(localError || error) && (
        <div className="error-banner">{localError || error}</div>
      )}

      <button type="submit" className="btn btn-primary" disabled={submitting || !pgn.trim()}>
        {submitting ? 'Analyzing with Stockfish...' : 'Analyze Game'}
      </button>
    </form>
  );
};

export default PgnUploader;
