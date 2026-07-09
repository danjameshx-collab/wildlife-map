import { useState } from 'react';

const PASSWORD = 'wildlifemap!';
const STORAGE_KEY = 'wildlife-map-auth';

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="gate-screen">
      <form className="gate-card" onSubmit={handleSubmit}>
        <span className="gate-icon">🐠</span>
        <h1>Wildlife Map</h1>
        <p>This site is password protected.</p>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          className={error ? 'gate-input gate-input-error' : 'gate-input'}
        />
        {error && <p className="gate-error">Incorrect password</p>}
        <button type="submit" className="gate-submit">Enter</button>
      </form>
    </div>
  );
}
