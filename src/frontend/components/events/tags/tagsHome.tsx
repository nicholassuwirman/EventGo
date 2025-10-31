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
  //useState of tags and setTags (setter)
  //where Tag[] mean sarray of Tag objects and ([]) means the array is empty
  const [tags, setTags] = useState<Tag[]>([]);

  // modal is a name for pop up window that temporarily blocks interaction with the page until its closed
  const [showModal, setShowModal] = useState(false); //default of showModal is false

  // useState, form data is the state object with name and color as the parameter for the object (also with default values)
  const [formData, setFormData] = useState({ name: '', color: '#FF8040' });
  
  //editingTag can be either Tag or null (when no tag is being edited)
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  //error message state for user feedback
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch all tags from database
  //when no method are specified, it defaults to get (so you can get away without saying method: 'GET')
  const fetchTags = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/tags');
      if (!response.ok) {
        setErrorMessage('Failed to load tags. Please refresh the page.');
        return;
      }
      const data = await response.json();
      setTags(data);  //pass all of the tags data to the array of Tags
    } catch (error) {
      console.error('Error fetching tags:', error);
      setErrorMessage('Failed to connect to server. Please check your connection.');
    }
  };

  //tagData is a function parameter thats built out of name and color (its formData from our UI)
  const handleAddTag = async (tagData: { name: string, color: string}) => {
    try {
      const response = await fetch('http://localhost:4000/api/tags', {  //specify the API route
        method: 'POST',   //specify the type of API that's called (if its not specified it default to GET)
        headers: {
          'Content-Type': 'application/json',   //explicitly say to the API hey please expect a JSON data
        },
        body: JSON.stringify(tagData),  //THIS is the line that actually sends the data to the POST API
      });

      if(response.ok) {   //check if response status is 200-209
        //the Create API returns a newTag, hence we get it via response.json()
        //why dont we just use tagData? bcs its a local version of our data from the frontend
        //to make sure the data is really created by tghe api and went well, we wait for the newTag passed by the API
        const newTag = await response.json();       
        setTags(prevTags => [...prevTags, newTag]); //add the newTag at the end of our prevTags array
        setErrorMessage(''); //clear any previous errors
        return true;
      } else {
        //get error message from backend
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to add tag');
        return false;
      }

    }catch (error) {
      console.error('Error adding tag:', error);
      setErrorMessage('Failed to connect to server. Please try again.');
      return false;
    }
  };

  
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
        setErrorMessage(''); //clear any previous errors
        return true;
      } else {
        //get error message from backend
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to update tag');
        return false;
      }
    } catch (error) {
      console.error('Error editing tag:', error);
      setErrorMessage('Failed to connect to server. Please try again.');
      return false;
    }
  };

  // handle form submission (decides between add or edit)
  //async allows await inside the function body
  //e is the parameter of the function
  //e: React.FormEvent means that the event is a react form event
  const handleFormSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); //prevent default behaviour of after submitting html form it reloads the page
    
    let success = false;  //is the api request a success?
    
    if (editingTag) {
      // EDIT existing tag
      success = await handleEditTag(editingTag.id, formData);
    } else {
      // if its Add Tag button, send the formData (the Tag) to handleAddTag function
      success = await handleAddTag(formData);
    }
    
    if (success) {
      closeModal();
    }
  };

  // Delete tag
  //needs an ID to specify which to delete
  const handleDeleteTag = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/tags/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        //create a new array without the tag without the deleted id
        //thats why tag.id !== id
        setTags(tags.filter(tag => tag.id !== id));
        setErrorMessage(''); //clear any previous errors
      } else {
        //get error message from backend
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to delete tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      setErrorMessage('Failed to connect to server. Please try again.');
    }
  };

  // Handle edit button click
  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color });
    setShowModal(true);
  };

  // Handle input changes
  // e stands for evetn, which is automatically passed by react when an event occurs
  // e: React.ChangeEvent is the type of events that occurs when the user changes the value of an input
  //<HTMLInputElement> is saying that the event comes from an <input> element
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ...formData copies all existing properties of the formData object into the new object
    // so if th euser only change the name, the color stays the same
    // use [e.target.name] as the key to search the object
    // e.target.value is the field that the user changed
    setFormData({ ...formData, [e.target.name]: e.target.value });  
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingTag(null);
    setFormData({ name: '', color: '#FF8040' });
    setErrorMessage(''); //clear error when closing modal
  };

  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);

  return (
    <div className="tags-home-container">
      <div className="tags-home-header">
        <h1>Tags</h1>

        {/*handle the Create tag*/}
        <button className="tags-home-add-btn" onClick={() => setShowModal(true)}>
          + Add Tag
        </button>
      </div>

      {/* Display error message if any */}
      {errorMessage && (
        <div className="error-message" style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '1em',
          border: '1px solid #ef5350'
        }}>
          {errorMessage}
        </div>
      )}

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

      {/* if showModal is true, return the UI (the add Tag window) */}
      {/* showModal is set to true when clicking + Add Tag at line 166 */}
      {showModal == true && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingTag ? 'Edit Tag' : 'Add Tag'}</h2>  {/* if editing tag, modal header text is Edit Tag, else Add Tag */}
            
            {/* Display error message in modal if any */}
            {errorMessage && (
              <div className="error-message" style={{ 
                backgroundColor: '#ffebee', 
                color: '#c62828', 
                padding: '10px', 
                borderRadius: '4px', 
                marginBottom: '1em',
                border: '1px solid #ef5350',
                fontSize: '0.9em'
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>  {/* onSubmit of the form, throws it to handleFormSubmit function */}
              <label>
                Tag Name:
                <input
                  type="text"
                  name="name"
                  value={formData.name}         //formData has name and color, now this assign the name to formData
                  onChange={handleInputChange}  //after a change, lets say input is Party as a tag name, it directly calls handleInputChange
                  required
                  minLength={1}
                  placeholder="Enter tag name"
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
                <button type="submit" className="tag-edit-btn"> {/* after clicking the button, it throws to line 190, hence type = submit */}
                  {editingTag ? 'Update' : 'Add'}  {/* if editing tag, button name is Update, else Add */}
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