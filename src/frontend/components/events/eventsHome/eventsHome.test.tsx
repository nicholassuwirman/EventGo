import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsHome from './eventsHome';

describe('EventsHome Component - Unit Tests', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // Clear localStorage
    localStorage.clear();
  });

  describe('Initial Rendering', () => {
    it('should render the events home page with header', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] }) // events
        .mockResolvedValueOnce({ ok: true, json: async () => [] }) // tags
        .mockResolvedValueOnce({ ok: true, json: async () => [] }); // participants

      render(<EventsHome />);
      
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('+ Add Event')).toBeInTheDocument();
    });

    it('should fetch and display events on mount', async () => {
      const mockEvents = [
        { id: 1, name: 'Conference 2025', date: '2025-12-01', duration: '3 hours', description: 'Tech conference', place: 'Berlin', tags: [], participants: [] },
        { id: 2, name: 'Workshop', date: '2025-11-15', duration: '2 hours', description: 'React workshop', place: 'Munich', tags: [], participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);

      await waitFor(() => {
        expect(screen.getByText('Conference 2025')).toBeInTheDocument();
        expect(screen.getByText('Workshop')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/events');
    });

    it('should fetch tags and participants on mount', async () => {
      const mockTags = [{ id: 1, name: 'Work', color: '#FF0000' }];
      const mockParticipants = [{ id: 1, name: 'John Doe', age: 25 }];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockTags })
        .mockResolvedValueOnce({ ok: true, json: async () => mockParticipants });

      render(<EventsHome />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/events');
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/tags');
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/participants');
      });
    });

    it('should show loading state initially', async () => {
      (global.fetch as any)
        .mockImplementationOnce(() => new Promise(() => {})) // Never resolves
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);

      expect(screen.getByText('Loading events...')).toBeInTheDocument();
    });

    it('should show empty state when no events exist', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);

      await waitFor(() => {
        expect(screen.getByText('No events found. Add your first event!')).toBeInTheDocument();
      });
    });

    it('should handle fetch error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching events:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Add Event Modal', () => {
    it('should open modal when Add Event button is clicked', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.queryByText('Loading events...')).not.toBeInTheDocument();
      });

      const addButton = screen.getByText('+ Add Event');
      await user.click(addButton);

      expect(screen.getByText('Add Event')).toBeInTheDocument();
      expect(screen.getByLabelText('Event Name:')).toBeInTheDocument();
      expect(screen.getByLabelText('Date:')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Duration')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Place')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
    });

    it('should close modal when Cancel button is clicked', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.queryByText('Loading events...')).not.toBeInTheDocument();
      });

      // Open modal
      await user.click(screen.getByText('+ Add Event'));
      expect(screen.getByText('Add Event')).toBeInTheDocument();

      // Close modal
      const cancelButtons = screen.getAllByText('Cancel');
      await user.click(cancelButtons[0]);
      
      await waitFor(() => {
        expect(screen.queryByText('Add Event')).not.toBeInTheDocument();
      });
    });

    it('should have empty form fields initially', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.queryByText('Loading events...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Event'));

      const nameInput = screen.getByLabelText('Event Name:') as HTMLInputElement;
      const dateInput = screen.getByLabelText('Date:') as HTMLInputElement;
      const durationInput = screen.getByPlaceholderText('Duration') as HTMLInputElement;
      const placeInput = screen.getByPlaceholderText('Place') as HTMLInputElement;
      
      expect(nameInput.value).toBe('');
      expect(dateInput.value).toBe('');
      expect(durationInput.value).toBe('');
      expect(placeInput.value).toBe('');
    });
  });

  describe('Create Event Functionality', () => {
    it('should create a new event successfully', async () => {
      const mockNewEvent = { 
        id: 1, 
        name: 'New Conference', 
        date: '2025-12-01', 
        duration: '3 hours', 
        description: 'Description',
        place: 'Berlin',
        tags: [], 
        participants: [] 
      };

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockNewEvent });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.queryByText('Loading events...')).not.toBeInTheDocument();
      });

      // Open modal
      await user.click(screen.getByText('+ Add Event'));

      // Fill form
      await user.type(screen.getByLabelText('Event Name:'), 'New Conference');
      await user.type(screen.getByLabelText('Date:'), '2025-12-01');
      await user.type(screen.getByPlaceholderText('Duration'), '3 hours');
      await user.type(screen.getByPlaceholderText('Place'), 'Berlin');
      await user.type(screen.getByPlaceholderText('Description'), 'Description');

      // Submit form - find the form element in the modal
      const modal = screen.getByText('Add Event').closest('.modal-content');
      const form = modal?.querySelector('form');
      if (form) {
        fireEvent.submit(form);
      }

      // Wait for POST call with more specific timeout
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(4); // Initial 3 + 1 POST
      }, { timeout: 3000 });

      // Verify the POST call details
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/events',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Check event appears in list
      await waitFor(() => {
        expect(screen.getByText('New Conference')).toBeInTheDocument();
      });
    });


  });

  describe('Edit Event Functionality', () => {
    it('should open edit modal with existing event data', async () => {
      const mockEvents = [
        { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', tags: [], participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Conference')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      // Check modal title and form values
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
      const nameInput = screen.getByLabelText('Event Name:') as HTMLInputElement;
      const dateInput = screen.getByLabelText('Date:') as HTMLInputElement;
      const durationInput = screen.getByPlaceholderText('Duration') as HTMLInputElement;
      const placeInput = screen.getByPlaceholderText('Place') as HTMLInputElement;
      
      expect(nameInput.value).toBe('Conference');
      expect(dateInput.value).toBe('2025-12-01');
      expect(durationInput.value).toBe('3 hours');
      expect(placeInput.value).toBe('Berlin');
    });

    it('should update event successfully', async () => {
      const mockEvents = [
        { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', tags: [], participants: [] },
      ];
      const updatedEvent = { id: 1, name: 'Updated Conference', date: '2025-12-15', duration: '4 hours', description: 'Updated', place: 'Munich', tags: [], participants: [] };

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => updatedEvent });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Conference')).toBeInTheDocument();
      });

      // Open edit modal
      await user.click(screen.getByText('Edit'));

      // Update form
      const nameInput = screen.getByLabelText('Event Name:');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Conference');

      await user.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/events/1',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      // Check updated event appears
      await waitFor(() => {
        expect(screen.getByText('Updated Conference')).toBeInTheDocument();
      });
    });

    it('should handle PUT request failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockEvents = [
        { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', tags: [], participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', text: async () => 'Error' });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('Conference'));
      await user.click(screen.getByText('Edit'));
      await user.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Delete Event Functionality', () => {
    it('should delete event successfully', async () => {
      const mockEvents = [
        { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', tags: [], participants: [] },
        { id: 2, name: 'Workshop', date: '2025-11-15', duration: '2 hours', description: 'React', place: 'Munich', tags: [], participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Conference')).toBeInTheDocument();
        expect(screen.getByText('Workshop')).toBeInTheDocument();
      });

      // Click delete on first event
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/events/1',
          expect.objectContaining({ method: 'DELETE' })
        );
      });

      // Event should be removed from UI
      await waitFor(() => {
        expect(screen.queryByText('Conference')).not.toBeInTheDocument();
        expect(screen.getByText('Workshop')).toBeInTheDocument();
      });
    });

    it('should handle DELETE request failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockEvents = [
        { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', tags: [], participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: false });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('Conference'));

      await user.click(screen.getByText('Delete'));

      // Event should still be in UI
      await waitFor(() => {
        expect(screen.getByText('Conference')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle network error during event deletion', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockEvents = [
        { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', tags: [], participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('Conference'));
      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting event:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Event Display Features', () => {
    it('should display events with tags', async () => {
      const mockEvents = [
        { 
          id: 1, 
          name: 'Conference', 
          date: '2025-12-01', 
          duration: '3 hours', 
          description: 'Tech', 
          place: 'Berlin',
          tags: [
            { id: 1, name: 'Work', color: '#FF0000' },
            { id: 2, name: 'Important', color: '#00FF00' }
          ],
          participants: [] 
        },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
        expect(screen.getByText('Important')).toBeInTheDocument();
        expect(screen.getByText('Tags:')).toBeInTheDocument();
      });
    });

    it('should display events with participants', async () => {
      const mockEvents = [
        { 
          id: 1, 
          name: 'Conference', 
          date: '2025-12-01', 
          duration: '3 hours', 
          description: 'Tech', 
          place: 'Berlin',
          tags: [],
          participants: [
            { id: 1, name: 'John Doe', age: 25 },
            { id: 2, name: 'Jane Smith', age: 30 }
          ]
        },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);

      await waitFor(() => {
        expect(screen.getByText('Show Participants (2)')).toBeInTheDocument();
      });
    });

    it('should open participants modal when Show Participants button is clicked', async () => {
      const mockEvents = [
        { 
          id: 1, 
          name: 'Conference', 
          date: '2025-12-01', 
          duration: '3 hours', 
          description: 'Tech', 
          place: 'Berlin',
          tags: [],
          participants: [
            { id: 1, name: 'John Doe', age: 25 }
          ]
        },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Show Participants (1)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Show Participants (1)'));

      await waitFor(() => {
        expect(screen.getByText('Participants - Conference')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('25 years old')).toBeInTheDocument();
      });
    });

    it('should close participants modal when close button is clicked', async () => {
      const mockEvents = [
        { 
          id: 1, 
          name: 'Conference', 
          date: '2025-12-01', 
          duration: '3 hours', 
          description: 'Tech', 
          place: 'Berlin',
          tags: [],
          participants: [{ id: 1, name: 'John Doe', age: 25 }]
        },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Show Participants (1)')).toBeInTheDocument();
      });

      // Open modal
      await user.click(screen.getByText('Show Participants (1)'));
      
      await waitFor(() => {
        expect(screen.getByText('Participants - Conference')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByText('×');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Participants - Conference')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Functionality', () => {
    it('should filter events by name', async () => {
      const mockEvents = [
        { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', tags: [], participants: [] },
        { id: 2, name: 'Workshop', date: '2025-11-15', duration: '2 hours', description: 'React', place: 'Munich', tags: [], participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Conference')).toBeInTheDocument();
        expect(screen.getByText('Workshop')).toBeInTheDocument();
      });

      // Search for "Conference"
      const searchInput = screen.getByPlaceholderText('Search by name...');
      await user.type(searchInput, 'Conference');

      await waitFor(() => {
        expect(screen.getByText('Conference')).toBeInTheDocument();
        expect(screen.queryByText('Workshop')).not.toBeInTheDocument();
      });
    });

    it('should filter events by place', async () => {
      const mockEvents = [
        { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', tags: [], participants: [] },
        { id: 2, name: 'Workshop', date: '2025-11-15', duration: '2 hours', description: 'React', place: 'Munich', tags: [], participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Conference')).toBeInTheDocument();
        expect(screen.getByText('Workshop')).toBeInTheDocument();
      });

      // Search for "Berlin"
      const searchInput = screen.getByPlaceholderText('Search by place...');
      await user.type(searchInput, 'Berlin');

      await waitFor(() => {
        expect(screen.getByText('Conference')).toBeInTheDocument();
        expect(screen.queryByText('Workshop')).not.toBeInTheDocument();
      });
    });

    it('should filter events by tag', async () => {
      const mockEvents = [
        { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', tags: [{ id: 1, name: 'Work', color: '#FF0000' }], participants: [] },
      ];
      const mockTags = [
        { id: 1, name: 'Work', color: '#FF0000' },
        { id: 2, name: 'Personal', color: '#00FF00' }
      ];
      const mockEventsByTag = [mockEvents[0]];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => mockTags })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEventsByTag });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Conference')).toBeInTheDocument();
      });

      // Select tag filter
      const tagSelect = screen.getByDisplayValue('All Events');
      await user.selectOptions(tagSelect, '1');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/events/by-tag/1');
      });
    });

    it('should show all events when tag filter is cleared', async () => {
      const mockEvents = [
        { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', tags: [], participants: [] },
      ];
      const mockTags = [{ id: 1, name: 'Work', color: '#FF0000' }];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockTags })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.queryByText('Loading events...')).not.toBeInTheDocument();
      });

      // Select tag filter
      const tagSelect = screen.getByDisplayValue('All Events');
      await user.selectOptions(tagSelect, '1');

      // Clear filter
      await user.selectOptions(tagSelect, '');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/events');
      });
    });
  });

  describe('Form Input Handling', () => {
    it('should update form fields correctly', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.queryByText('Loading events...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Event'));

      const nameInput = screen.getByLabelText('Event Name:') as HTMLInputElement;
      const dateInput = screen.getByLabelText('Date:') as HTMLInputElement;
      const durationInput = screen.getByPlaceholderText('Duration') as HTMLInputElement;
      const placeInput = screen.getByPlaceholderText('Place') as HTMLInputElement;

      await user.type(nameInput, 'Test Event');
      expect(nameInput.value).toBe('Test Event');

      await user.type(dateInput, '2025-12-25');
      expect(dateInput.value).toBe('2025-12-25');

      await user.type(durationInput, '2 hours');
      expect(durationInput.value).toBe('2 hours');

      await user.type(placeInput, 'Berlin');
      expect(placeInput.value).toBe('Berlin');
    });

    it('should reset form when modal is closed', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.queryByText('Loading events...')).not.toBeInTheDocument();
      });

      // Open modal and fill form
      await user.click(screen.getByText('+ Add Event'));
      await user.type(screen.getByLabelText('Event Name:'), 'Test Event');
      await user.type(screen.getByLabelText('Date:'), '2025-12-25');

      // Close modal
      const cancelButtons = screen.getAllByText('Cancel');
      await user.click(cancelButtons[0]);

      // Reopen modal
      await user.click(screen.getByText('+ Add Event'));

      // Form should be reset
      const nameInput = screen.getByLabelText('Event Name:') as HTMLInputElement;
      const dateInput = screen.getByLabelText('Date:') as HTMLInputElement;
      
      expect(nameInput.value).toBe('');
      expect(dateInput.value).toBe('');
    });
  });

  describe('LocalStorage Integration', () => {
    it('should update localStorage when event is created', async () => {
      const mockNewEvent = { 
        id: 1, 
        name: 'New Event', 
        date: '2025-12-01', 
        duration: '3 hours', 
        description: 'Test',
        place: 'Berlin',
        tags: [], 
        participants: [] 
      };

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockNewEvent });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.queryByText('Loading events...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Event'));
      await user.type(screen.getByLabelText('Event Name:'), 'New Event');
      await user.type(screen.getByLabelText('Date:'), '2025-12-01');
      await user.type(screen.getByPlaceholderText('Description'), 'Test');

      // Submit form directly
      const modal = screen.getByText('Add Event').closest('.modal-content');
      const form = modal?.querySelector('form');
      if (form) {
        fireEvent.submit(form);
      }

      // Wait for POST call to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(4); // Initial 3 + 1 POST
      }, { timeout: 3000 });

      // Check localStorage was updated
      await waitFor(() => {
        expect(localStorage.getItem('eventsUpdated')).toBeTruthy();
      });
    });

    it('should update localStorage when event is deleted', async () => {
      const mockEvents = [
        { id: 1, name: 'Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', tags: [], participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true });

      render(<EventsHome />);
      const user = userEvent.setup();

      await waitFor(() => screen.getByText('Conference'));
      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(localStorage.getItem('eventsUpdated')).toBeTruthy();
      });
    });
  });
});
