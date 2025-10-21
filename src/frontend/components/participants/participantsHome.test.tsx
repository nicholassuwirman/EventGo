import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipantsHome from './participantsHome';

describe('ParticipantsHome Component - Unit Tests', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Initial Rendering', () => {
    it('should render the participants home page with header', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<ParticipantsHome />);
      
      expect(screen.getByText('Participants')).toBeInTheDocument();
      expect(screen.getByText('+ Add Participant')).toBeInTheDocument();
    });

    it('should fetch and display participants on mount', async () => {
      const mockParticipants = [
        { id: 1, name: 'John Doe', age: 25, events: [] },
        { id: 2, name: 'Jane Smith', age: 30, events: [] },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Age: 25')).toBeInTheDocument();
        expect(screen.getByText('Age: 30')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/participants');
    });

    it('should handle fetch error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<ParticipantsHome />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('cant fetch events in participantsHome', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Add Participant Modal', () => {
    it('should open modal when Add Participant button is clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      const addButton = screen.getByText('+ Add Participant');
      await user.click(addButton);

      expect(screen.getByText('Add Participant')).toBeInTheDocument();
      expect(screen.getByLabelText('Name:')).toBeInTheDocument();
      expect(screen.getByLabelText('Age:')).toBeInTheDocument();
    });

    it('should close modal when Cancel button is clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      // Open modal
      await user.click(screen.getByText('+ Add Participant'));
      expect(screen.getByText('Add Participant')).toBeInTheDocument();

      // Close modal
      const cancelButtons = screen.getAllByText('Cancel');
      await user.click(cancelButtons[0]);
      
      await waitFor(() => {
        expect(screen.queryByText('Add Participant')).not.toBeInTheDocument();
      });
    });

    it('should have empty form fields initially', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await user.click(screen.getByText('+ Add Participant'));

      const nameInput = screen.getByLabelText('Name:') as HTMLInputElement;
      const ageInput = screen.getByLabelText('Age:') as HTMLInputElement;
      
      expect(nameInput.value).toBe('');
      expect(ageInput.value).toBe('');
    });
  });

  describe('Create Participant Functionality', () => {
    it('should create a new participant successfully', async () => {
      const mockNewParticipant = { id: 1, name: 'John Doe', age: 25, events: [] };

      // Mock initial fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      // Open modal
      await user.click(screen.getByText('+ Add Participant'));

      // Fill form
      const nameInput = screen.getByLabelText('Name:');
      const ageInput = screen.getByLabelText('Age:');
      
      await user.type(nameInput, 'John Doe');
      await user.type(ageInput, '25');

      // Mock POST request
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewParticipant,
      });

      // Submit form
      const addButtons = screen.getAllByText('Add');
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/participants',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'John Doe', age: 25 }),
          })
        );
      });

      // Check participant appears in list
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Age: 25')).toBeInTheDocument();
      });
    });

    it('should handle POST request failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock initial fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      // Open modal and fill form
      await user.click(screen.getByText('+ Add Participant'));
      await user.type(screen.getByLabelText('Name:'), 'Test User');
      await user.type(screen.getByLabelText('Age:'), '30');

      // Mock failed POST
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const addButtons = screen.getAllByText('Add');
      await user.click(addButtons[0]);

      // Modal should still be open on failure
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Response not ok:', 400, 'Bad Request');
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle network error during participant creation', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock initial fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await user.click(screen.getByText('+ Add Participant'));
      await user.type(screen.getByLabelText('Name:'), 'Test User');
      await user.type(screen.getByLabelText('Age:'), '30');

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const addButtons = screen.getAllByText('Add');
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving participant:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edit Participant Functionality', () => {
    it('should open edit modal with existing participant data', async () => {
      const mockParticipants = [
        { id: 1, name: 'John Doe', age: 25, events: [] },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      // Check modal title and form values
      expect(screen.getByText('Edit Participant')).toBeInTheDocument();
      const nameInput = screen.getByLabelText('Name:') as HTMLInputElement;
      const ageInput = screen.getByLabelText('Age:') as HTMLInputElement;
      
      expect(nameInput.value).toBe('John Doe');
      expect(ageInput.value).toBe('25');
    });

    it('should update participant successfully', async () => {
      const mockParticipants = [
        { id: 1, name: 'John Doe', age: 25, events: [] },
      ];
      const updatedParticipant = { id: 1, name: 'John Updated', age: 30, events: [] };

      // Mock initial fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Open edit modal
      await user.click(screen.getByText('Edit'));

      // Update form
      const nameInput = screen.getByLabelText('Name:');
      const ageInput = screen.getByLabelText('Age:');
      
      await user.clear(nameInput);
      await user.type(nameInput, 'John Updated');
      await user.clear(ageInput);
      await user.type(ageInput, '30');

      // Mock PUT request
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedParticipant,
      });

      await user.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/participants/1',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'John Updated', age: 30 }),
          })
        );
      });

      // Check updated participant appears
      await waitFor(() => {
        expect(screen.getByText('John Updated')).toBeInTheDocument();
        expect(screen.getByText('Age: 30')).toBeInTheDocument();
      });
    });

    it('should handle PUT request failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockParticipants = [{ id: 1, name: 'John Doe', age: 25, events: [] }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('John Doe'));
      await user.click(screen.getByText('Edit'));

      // Mock failed PUT
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await user.click(screen.getByText('Update'));

      // Modal should remain open on failure
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Response not ok:', 404, 'Not Found');
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle network error during participant update', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockParticipants = [{ id: 1, name: 'John Doe', age: 25, events: [] }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('John Doe'));
      await user.click(screen.getByText('Edit'));

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await user.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving participant:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Delete Participant Functionality', () => {
    it('should delete participant successfully', async () => {
      const mockParticipants = [
        { id: 1, name: 'John Doe', age: 25, events: [] },
        { id: 2, name: 'Jane Smith', age: 30, events: [] },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Mock DELETE request
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      // Click delete on first participant
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/participants/1',
          expect.objectContaining({ method: 'DELETE' })
        );
      });

      // Participant should be removed from UI
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should handle DELETE request failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockParticipants = [{ id: 1, name: 'John Doe', age: 25, events: [] }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('John Doe'));

      // Mock failed DELETE
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await user.click(screen.getByText('Delete'));

      // Participant should still be in UI
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle network error during participant deletion', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockParticipants = [{ id: 1, name: 'John Doe', age: 25, events: [] }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('John Doe'));

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting participant:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Participant Card Display', () => {
    it('should render multiple participants correctly', async () => {
      const mockParticipants = [
        { id: 1, name: 'John Doe', age: 25, events: [] },
        { id: 2, name: 'Jane Smith', age: 30, events: [] },
        { id: 3, name: 'Bob Johnson', age: 35, events: [] },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);

      await waitFor(() => {
        mockParticipants.forEach(participant => {
          expect(screen.getByText(participant.name)).toBeInTheDocument();
          expect(screen.getByText(`Age: ${participant.age}`)).toBeInTheDocument();
        });
      });

      // Check that all edit and delete buttons are present
      expect(screen.getAllByText('Edit')).toHaveLength(3);
      expect(screen.getAllByText('Delete')).toHaveLength(3);
    });

    it('should display empty list when no participants exist', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<ParticipantsHome />);

      await waitFor(() => {
        expect(screen.getByText('Participants')).toBeInTheDocument();
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
      });
    });

    it('should show "Show Events" button when participant has events', async () => {
      const mockParticipants = [
        { 
          id: 1, 
          name: 'John Doe', 
          age: 25, 
          events: [
            { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech conference', place: 'Berlin' },
            { id: 2, name: 'Workshop', date: '2025-11-15', duration: '2 hours', description: 'React workshop', place: 'Munich' },
          ]
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);

      await waitFor(() => {
        expect(screen.getByText('Show Events (2)')).toBeInTheDocument();
      });
    });

    it('should not show "Show Events" button when participant has no events', async () => {
      const mockParticipants = [
        { id: 1, name: 'John Doe', age: 25, events: [] },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText(/Show Events/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Events Modal Functionality', () => {
    it('should open events modal when Show Events button is clicked', async () => {
      const mockParticipants = [
        { 
          id: 1, 
          name: 'John Doe', 
          age: 25, 
          events: [
            { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech conference', place: 'Berlin' },
          ]
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Show Events (1)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Show Events (1)'));

      await waitFor(() => {
        expect(screen.getByText('Events - John Doe')).toBeInTheDocument();
        expect(screen.getByText('Conference')).toBeInTheDocument();
        expect(screen.getByText('Berlin')).toBeInTheDocument();
      });
    });

    it('should close events modal when close button is clicked', async () => {
      const mockParticipants = [
        { 
          id: 1, 
          name: 'John Doe', 
          age: 25, 
          events: [
            { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech conference', place: 'Berlin' },
          ]
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Show Events (1)')).toBeInTheDocument();
      });

      // Open modal
      await user.click(screen.getByText('Show Events (1)'));
      
      await waitFor(() => {
        expect(screen.getByText('Events - John Doe')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByText('×');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Events - John Doe')).not.toBeInTheDocument();
      });
    });

    it('should display upcoming events correctly', async () => {
      const futureDate = '2025-12-31'; // Future date
      const mockParticipants = [
        { 
          id: 1, 
          name: 'John Doe', 
          age: 25, 
          events: [
            { id: 1, name: 'Future Event', date: futureDate, duration: '3 hours', description: 'Event', place: 'Berlin' },
          ]
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Show Events (1)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Show Events (1)'));

      await waitFor(() => {
        expect(screen.getByText('Upcoming')).toBeInTheDocument();
      });
    });

    it('should display past events correctly', async () => {
      const pastDate = '2020-01-01'; // Past date
      const mockParticipants = [
        { 
          id: 1, 
          name: 'John Doe', 
          age: 25, 
          events: [
            { id: 1, name: 'Past Event', date: pastDate, duration: '3 hours', description: 'Event', place: 'Berlin' },
          ]
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Show Events (1)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Show Events (1)'));

      await waitFor(() => {
        expect(screen.getByText('Past')).toBeInTheDocument();
      });
    });
  });

  describe('Form Input Handling', () => {
    it('should update form fields correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await user.click(screen.getByText('+ Add Participant'));

      const nameInput = screen.getByLabelText('Name:') as HTMLInputElement;
      const ageInput = screen.getByLabelText('Age:') as HTMLInputElement;

      await user.type(nameInput, 'Test User');
      expect(nameInput.value).toBe('Test User');

      await user.type(ageInput, '42');
      expect(ageInput.value).toBe('42');
    });

    it('should reset form when modal is closed', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      // Open modal and fill form
      await user.click(screen.getByText('+ Add Participant'));
      await user.type(screen.getByLabelText('Name:'), 'Test User');
      await user.type(screen.getByLabelText('Age:'), '30');

      // Close modal
      const cancelButtons = screen.getAllByText('Cancel');
      await user.click(cancelButtons[0]);

      // Reopen modal
      await user.click(screen.getByText('+ Add Participant'));

      // Form should be reset
      const nameInput = screen.getByLabelText('Name:') as HTMLInputElement;
      const ageInput = screen.getByLabelText('Age:') as HTMLInputElement;
      
      expect(nameInput.value).toBe('');
      expect(ageInput.value).toBe('');
    });

    it('should accept only numbers in age field', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<ParticipantsHome />);
      const user = userEvent.setup();

      await user.click(screen.getByText('+ Add Participant'));

      const ageInput = screen.getByLabelText('Age:') as HTMLInputElement;
      
      expect(ageInput.type).toBe('number');
      expect(ageInput.min).toBe('0');
    });
  });
});
