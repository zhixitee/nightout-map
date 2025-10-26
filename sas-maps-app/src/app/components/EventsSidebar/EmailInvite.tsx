"use client";

import { useState, useRef } from 'react';
import styles from './EmailInvite.module.css';
import { supabase } from '@/lib/supabaseClient';

interface EmailChip {
  email: string;
  valid: boolean;
}

interface EmailInviteProps {
  onInvite: (emails: string[]) => void;
  eventId?: string;
}

interface UserSuggestion {
  email: string;
  id: string;
}

export default function EmailInvite({ onInvite, eventId }: EmailInviteProps) {
  const [inputValue, setInputValue] = useState('');
  const [chips, setChips] = useState<EmailChip[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Search for users in the auth.users table
      const { data, error } = await supabase
        .from('profiles')
        .select('email, id')
        .ilike('email', `%${query}%`)
        .limit(5);

      if (error) {
        console.error('Error searching users:', error);
        setSuggestions([]);
        return;
      }

      // Filter out already added emails
      const addedEmails = chips.map(chip => chip.email.toLowerCase());
      const filteredData = (data || []).filter(
        user => !addedEmails.includes(user.email.toLowerCase())
      );

      setSuggestions(filteredData);
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length === 0) {
      setSuggestions([]);
    }
  };

  const addChip = (email: string) => {
    if (email) {
      const isValid = validateEmail(email);
      setChips([...chips, { email, valid: isValid }]);
      setInputValue('');
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();

      if (inputValue.includes('@')) {
        addChip(inputValue);
      } else {
        searchUsers(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && chips.length > 0) {
      setChips(chips.slice(0, -1));
    }
  };

  const removeChip = (index: number) => {
    setChips(chips.filter((_, i) => i !== index));
  };

  const handleSendInvites = () => {
    const validEmails = chips.filter(chip => chip.valid).map(chip => chip.email);
    if (validEmails.length > 0) {
      onInvite(validEmails);
      setChips([]);
    }
  };

  const handleSuggestionClick = (suggestion: UserSuggestion) => {
    addChip(suggestion.email);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>Search and add people by email:</label>
      <div className={styles.inputContainer}>
        <div className={styles.chipList}>
          {chips.map((chip, index) => (
            <div
              key={index}
              className={`${styles.chip} ${chip.valid ? '' : styles.invalid}`}
            >
              <span>{chip.email}</span>
              <button
                type="button"
                onClick={() => removeChip(index)}
                className={styles.chipRemove}
              >
                ×
              </button>
            </div>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type email or search for users..."
            className={styles.input}
          />
        </div>
      </div>
      {loading && (
        <div className={styles.loadingIndicator}>Searching...</div>
      )}
      {suggestions.length > 0 && !loading && (
        <div className={styles.suggestions}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              className={styles.suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className={styles.suggestionEmail}>{suggestion.email}</div>
              <div className={styles.suggestionBadge}>User</div>
            </div>
          ))}
        </div>
      )}
      {inputValue && suggestions.length === 0 && !loading && validateEmail(inputValue) && (
        <div className={styles.suggestions}>
          <div
            className={styles.suggestion}
            onClick={() => handleSuggestionClick({ email: inputValue, id: '' })}
          >
            <div className={styles.suggestionEmail}>{inputValue}</div>
            <div className={styles.suggestionBadge}>Add as new</div>
          </div>
        </div>
      )}
      <button
        onClick={handleSendInvites}
        disabled={!chips.some(chip => chip.valid)}
        className={styles.sendButton}
      >
        Send Invites ({chips.filter(chip => chip.valid).length})
      </button>
    </div>
  );
}