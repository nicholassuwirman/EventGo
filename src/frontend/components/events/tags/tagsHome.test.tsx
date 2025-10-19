import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagsHome from './tagsHome';

describe('TagsHome Component - Unit Tests', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Initial Rendering', () => {
    it('should render the tags home page with header', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TagsHome />);
      
      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('+ Add Tag')).toBeInTheDocument();
    });

    it('should fetch and display tags on mount', async () => {
      const mockTags = [
        { id: 1, name: 'Work', color: '#FF0000' },
        { id: 2, name: 'Personal', color: '#00FF00' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      });

      render(<TagsHome />);

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/tags');
    });

    it('should handle fetch error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<TagsHome />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching tags:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Add Tag Modal', () => {
    it('should open modal when Add Tag button is clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      const addButton = screen.getByText('+ Add Tag');
      await user.click(addButton);

      expect(screen.getByText('Add Tag')).toBeInTheDocument();
      expect(screen.getByLabelText('Tag Name:')).toBeInTheDocument();
      expect(screen.getByLabelText('Tag Color:')).toBeInTheDocument();
    });

    it('should close modal when Cancel button is clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      // Open modal
      await user.click(screen.getByText('+ Add Tag'));
      expect(screen.getByText('Add Tag')).toBeInTheDocument();

      // Close modal
      await user.click(screen.getByText('Cancel'));
      
      await waitFor(() => {
        expect(screen.queryByText('Add Tag')).not.toBeInTheDocument();
      });
    });

    it('should have default color value in form', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      await user.click(screen.getByText('+ Add Tag'));

      const colorInput = screen.getByLabelText('Tag Color:') as HTMLInputElement;
      expect(colorInput.value).toBe('#ff8040');
    });
  });

  describe('Create Tag Functionality', () => {
    it('should create a new tag successfully', async () => {
      const mockNewTag = { id: 1, name: 'Urgent', color: '#FF0000' };

      // Mock initial fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      // Open modal
      await user.click(screen.getByText('+ Add Tag'));

      // Fill form
      const nameInput = screen.getByLabelText('Tag Name:');
      
      await user.clear(nameInput);
      await user.type(nameInput, 'Urgent');

      // Mock POST request
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewTag,
      });

      // Submit form
      await user.click(screen.getByText('Add'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/tags',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      // Check tag appears in list
      await waitFor(() => {
        expect(screen.getByText('Urgent')).toBeInTheDocument();
      });
    });

    it('should handle POST request failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock initial fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      // Open modal and fill form
      await user.click(screen.getByText('+ Add Tag'));
      await user.type(screen.getByLabelText('Tag Name:'), 'Test');

      // Mock failed POST
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await user.click(screen.getByText('Add'));

      // Modal should still be open on failure
      await waitFor(() => {
        expect(screen.getByText('Add Tag')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle network error during tag creation', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock initial fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      await user.click(screen.getByText('+ Add Tag'));
      await user.type(screen.getByLabelText('Tag Name:'), 'Test');

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await user.click(screen.getByText('Add'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding tag:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edit Tag Functionality', () => {
    it('should open edit modal with existing tag data', async () => {
      const mockTags = [
        { id: 1, name: 'Work', color: '#FF0000' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      // Check modal title and form values
      expect(screen.getByText('Edit Tag')).toBeInTheDocument();
      const nameInput = screen.getByLabelText('Tag Name:') as HTMLInputElement;
      const colorInput = screen.getByLabelText('Tag Color:') as HTMLInputElement;
      
      expect(nameInput.value).toBe('Work');
      expect(colorInput.value).toBe('#ff0000');
    });

    it('should update tag successfully', async () => {
      const mockTags = [
        { id: 1, name: 'Work', color: '#FF0000' },
      ];
      const updatedTag = { id: 1, name: 'Work Updated', color: '#00FF00' };

      // Mock initial fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });

      // Open edit modal
      await user.click(screen.getByText('Edit'));

      // Update form
      const nameInput = screen.getByLabelText('Tag Name:');
      await user.clear(nameInput);
      await user.type(nameInput, 'Work Updated');

      // Mock PUT request
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedTag,
      });

      await user.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/tags/1',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      // Check updated tag appears
      await waitFor(() => {
        expect(screen.getByText('Work Updated')).toBeInTheDocument();
      });
    });

    it('should handle PUT request failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockTags = [{ id: 1, name: 'Work', color: '#FF0000' }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('Work'));
      await user.click(screen.getByText('Edit'));

      // Mock failed PUT
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await user.click(screen.getByText('Update'));

      // Modal should remain open on failure
      await waitFor(() => {
        expect(screen.getByText('Edit Tag')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle network error during tag update', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockTags = [{ id: 1, name: 'Work', color: '#FF0000' }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('Work'));
      await user.click(screen.getByText('Edit'));

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await user.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error editing tag:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Delete Tag Functionality', () => {
    it('should delete tag successfully', async () => {
      const mockTags = [
        { id: 1, name: 'Work', color: '#FF0000' },
        { id: 2, name: 'Personal', color: '#00FF00' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
      });

      // Mock DELETE request
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      // Click delete on first tag
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/tags/1',
          expect.objectContaining({ method: 'DELETE' })
        );
      });

      // Tag should be removed from UI
      await waitFor(() => {
        expect(screen.queryByText('Work')).not.toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
      });
    });

    it('should handle DELETE request failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockTags = [{ id: 1, name: 'Work', color: '#FF0000' }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('Work'));

      // Mock failed DELETE
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await user.click(screen.getByText('Delete'));

      // Tag should still be in UI
      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle network error during tag deletion', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockTags = [{ id: 1, name: 'Work', color: '#FF0000' }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('Work'));

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting tag:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('TagCard Component Integration', () => {
    it('should render multiple tags correctly', async () => {
      const mockTags = [
        { id: 1, name: 'Work', color: '#FF0000' },
        { id: 2, name: 'Personal', color: '#00FF00' },
        { id: 3, name: 'Urgent', color: '#0000FF' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      });

      render(<TagsHome />);

      await waitFor(() => {
        mockTags.forEach(tag => {
          expect(screen.getByText(tag.name)).toBeInTheDocument();
        });
      });

      // Check that all edit and delete buttons are present
      expect(screen.getAllByText('Edit')).toHaveLength(3);
      expect(screen.getAllByText('Delete')).toHaveLength(3);
    });

    it('should display empty list when no tags exist', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TagsHome />);

      await waitFor(() => {
        expect(screen.getByText('Tags')).toBeInTheDocument();
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Input Handling', () => {
    it('should update form fields correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      await user.click(screen.getByText('+ Add Tag'));

      const nameInput = screen.getByLabelText('Tag Name:') as HTMLInputElement;
      const colorInput = screen.getByLabelText('Tag Color:') as HTMLInputElement;

      await user.clear(nameInput);
      await user.type(nameInput, 'Test Tag');
      expect(nameInput.value).toBe('Test Tag');

      // For color input, just type directly
      await user.type(colorInput, '#123456');
      // Color input will have the new value
      expect(colorInput.value).toBeDefined();
    });

    it('should reset form when modal is closed', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TagsHome />);
      const user = userEvent.setup();

      // Open modal and fill form
      await user.click(screen.getByText('+ Add Tag'));
      await user.type(screen.getByLabelText('Tag Name:'), 'Test');

      // Close modal
      await user.click(screen.getByText('Cancel'));

      // Reopen modal
      await user.click(screen.getByText('+ Add Tag'));

      // Form should be reset
      const nameInput = screen.getByLabelText('Tag Name:') as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });
});
