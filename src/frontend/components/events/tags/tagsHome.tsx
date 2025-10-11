import React, { useState, useEffect } from 'react';
import './tagsHome.css';

type Tag = {
  id: number;
  name: string;
  color: string;
};

type TagCardProps = {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (id: number) => void;
};

const TagCard: React.FC<TagCardProps> = ({ tag, onEdit, onDelete }) => (
  <div className="tag-card" style={{ borderColor: tag.color }}>
    <div className="tag-color-dot" style={{ background: tag.color }} />
    <span className="tag-name">{tag.name}</span>
    <div className="tag-actions">
      <button
        className="tag-edit-btn"
        onClick={() => onEdit(tag)}
      >
        Edit
      </button>
      <button
        className="tag-delete-btn"
        onClick={() => onDelete(tag.id)}
      >
        Delete
      </button>
    </div>
  </div>
);

const TagsHome: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#FF8040' });
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Fetch all tags from database
  const fetchTags = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/tags');
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // ADD NEW TAG (POST)
  const handleAddTag = async (tagData: { name: string; color: string }) => {
    try {
      const response = await fetch('http://localhost:4000/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      });
      
      if (response.ok) {
        const newTag = await response.json();
        setTags(prevTags => [...prevTags, newTag]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding tag:', error);
      return false;
    }
  };

  // EDIT EXISTING TAG (PUT)
  const handleEditTag = async (id: number, tagData: { name: string; color: string }) => {
    try {
      const response = await fetch(`http://localhost:4000/api/tags/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      });
      
      if (response.ok) {
        const updatedTag = await response.json();
        setTags(prevTags => 
          prevTags.map(tag => tag.id === updatedTag.id ? updatedTag : tag)
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error editing tag:', error);
      return false;
    }
  };

  // Handle form submission (decides between add or edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let success = false;
    
    if (editingTag) {
      // EDIT existing tag
      success = await handleEditTag(editingTag.id, formData);
    } else {
      // ADD new tag
      success = await handleAddTag(formData);
    }
    
    if (success) {
      closeModal();
    }
  };

  // Delete tag
  const handleDeleteTag = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/tags/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setTags(tags.filter(tag => tag.id !== id));
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  // Handle edit button click
  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color });
    setShowModal(true);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingTag(null);
    setFormData({ name: '', color: '#FF8040' });
  };

  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);

  return (
    <div className="tags-home-container">
      <div className="tags-home-header">
        <h1>Tags</h1>
        <button className="tags-home-add-btn" onClick={() => setShowModal(true)}>
          + Add Tag
        </button>
      </div>
      <div className="tags-list">
        {tags.map(tag => (
          <TagCard 
            key={tag.id} 
            tag={tag} 
            onEdit={handleEditClick}
            onDelete={handleDeleteTag}
          />
        ))}
      </div>

      {/* Add/Edit Tag Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingTag ? 'Edit Tag' : 'Add Tag'}</h2>
            <form onSubmit={handleFormSubmit}>
              <label>
                Tag Name:
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Tag Color:
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <div style={{ marginTop: '1em', display: 'flex', gap: '1em' }}>
                <button type="submit" className="tag-edit-btn">
                  {editingTag ? 'Update' : 'Add'}
                </button>
                <button type="button" className="tag-delete-btn" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagsHome;