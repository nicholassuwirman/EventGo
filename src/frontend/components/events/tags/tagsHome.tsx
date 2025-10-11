import React, { useState } from 'react';
import './tagsHome.css';

type Tag = {
  id: number;
  name: string;
  color: string;
};

// Reusable TagCard component
type TagCardProps = {
  tag: Tag;
  onEdit?: (tag: Tag) => void;
  onDelete?: (id: number) => void;
  disabled?: boolean;
};

const TagCard: React.FC<TagCardProps> = ({ tag, onEdit, onDelete, disabled }) => (
  <div className="tag-card" style={{ borderColor: tag.color }}>
    <div className="tag-color-dot" style={{ background: tag.color }} />
    <span className="tag-name">{tag.name}</span>
    <div className="tag-actions">
      <button
        className="tag-edit-btn"
        onClick={() => onEdit && onEdit(tag)}
        disabled={disabled}
      >
        Edit
      </button>
      <button
        className="tag-delete-btn"
        onClick={() => onDelete && onDelete(tag.id)}
        disabled={disabled}
      >
        Delete
      </button>
    </div>
  </div>
);

const TagsHome: React.FC = () => {
  const exampleTag: Tag = { id: 1, name: 'Sport', color: '#FF8040' };

  return (
    <div className="tags-home-container">
      <div className="tags-home-header">
        <h1>Tags</h1>
        <button className="tags-home-add-btn" disabled>
          + Add Tag
        </button>
      </div>
      <div className="tags-list">
        <TagCard tag={exampleTag} disabled />
      </div>
    </div>
  );
};

export default TagsHome;