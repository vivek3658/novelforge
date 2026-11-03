import React, { useId, useState } from 'react';

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

function normalizeTag(value) {
  return value
    .trim()
    .replace(/^#+/, '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .slice(0, MAX_TAG_LENGTH);
}

export default function TagInput({ tags, onChange, label = 'Hashtags', hint = 'Type a tag and press Enter.' }) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const [draft, setDraft] = useState('');

  const addTags = (values) => {
    const additions = values.map(normalizeTag).filter(Boolean);
    const nextTags = [...tags];
    additions.forEach((tag) => {
      if (nextTags.length < MAX_TAGS && !nextTags.some((current) => current.toLowerCase() === tag)) {
        nextTags.push(tag);
      }
    });
    onChange(nextTags);
    setDraft('');
  };

  const commitDraft = () => {
    if (draft.trim()) addTags(draft.split(','));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitDraft();
    } else if (event.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  const handlePaste = (event) => {
    const pastedText = event.clipboardData.getData('text');
    if (pastedText.includes(',')) {
      event.preventDefault();
      addTags([...pastedText.split(','), draft]);
    }
  };

  return (
    <div className="tag-input">
      <label htmlFor={inputId}>{label}</label>
      <div className="tag-input-field">
        {tags.map((tag) => (
          <span className="tag-input-chip" key={tag}>
            <span>#{tag}</span>
            <button type="button" aria-label={`Remove #${tag}`} onClick={() => onChange(tags.filter((item) => item !== tag))}>
              ×
            </button>
          </span>
        ))}
        <input
          id={inputId}
          type="text"
          value={draft}
          maxLength={MAX_TAG_LENGTH + 1}
          placeholder={tags.length ? '' : 'Add a hashtag'}
          aria-describedby={hintId}
          disabled={tags.length >= MAX_TAGS}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={commitDraft}
        />
      </div>
      <div className="tag-input-hint" id={hintId}>
        <span>{hint}</span>
        <span>{tags.length}/{MAX_TAGS}</span>
      </div>
    </div>
  );
}
