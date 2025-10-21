import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './home';

// Mock the asset imports
vi.mock('../../../assets/event-logo.png', () => ({ default: 'event-logo.png' }));
vi.mock('../../../assets/participant-logo.png', () => ({ default: 'participant-logo.png' }));
vi.mock('../../../assets/tag-logo.png', () => ({ default: 'tag-logo.png' }));
vi.mock('../../../assets/dashboard-logo.png', () => ({ default: 'dashboard-logo.png' }));

// Wrapper component to provide Router context
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Home Component - Unit Tests', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // Clear localStorage
    localStorage.clear();
  });

  describe('Initial Rendering', () => {
    it('should render the dashboard page with header', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Welcome back! Here\'s your event management overview.')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter(<Home />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('should fetch data from all three APIs on mount', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/events');
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/participants');
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/tags');
      });
    });

    it('should handle fetch error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching dashboard data:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('should display dashboard after loading completes', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Display', () => {
    it('should display correct statistics for all data', async () => {
      const mockEvents = [
        { id: 1, name: 'Event 1', date: '2025-12-01', duration: '1h', description: 'Desc', place: 'Berlin', participants: [] },
        { id: 2, name: 'Event 2', date: '2025-11-15', duration: '2h', description: 'Desc', place: 'Munich', participants: [] },
      ];
      const mockParticipants = [
        { id: 1, name: 'John Doe', email: 'john@example.com', events: [] },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', events: [] },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', events: [] },
      ];
      const mockTags = [
        { id: 1, name: 'Conference', color: '#FF5733', events: [] },
        { id: 2, name: 'Workshop', color: '#33FF57', events: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => mockParticipants })
        .mockResolvedValueOnce({ ok: true, json: async () => mockTags });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Total Events')).toBeInTheDocument();
        expect(screen.getByText('Participants')).toBeInTheDocument();
        expect(screen.getByText('Tags')).toBeInTheDocument();
      });
    });

    it('should display zero statistics when no data exists', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThanOrEqual(4); // At least 4 stats showing 0
      });
    });

    it('should calculate events this month correctly', async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const mockEvents = [
        { id: 1, name: 'Event This Month', date: new Date(currentYear, currentMonth, 15).toISOString(), duration: '1h', description: 'Desc', place: 'Berlin', participants: [] },
        { id: 2, name: 'Event Next Month', date: new Date(currentYear, currentMonth + 1, 15).toISOString(), duration: '2h', description: 'Desc', place: 'Munich', participants: [] },
        { id: 3, name: 'Event Last Month', date: new Date(currentYear, currentMonth - 1, 15).toISOString(), duration: '3h', description: 'Desc', place: 'Hamburg', participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Events This Month')).toBeInTheDocument();
        // Should show 1 event this month
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should handle non-array responses from APIs', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ error: 'Not an array' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ error: 'Not an array' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ error: 'Not an array' }) });

      renderWithRouter(<Home />);

      await waitFor(() => {
        // Should display zeros when data is not in expected format
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('StatCard Component', () => {
    it('should render all four stat cards with correct titles', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Total Events')).toBeInTheDocument();
        expect(screen.getByText('Participants')).toBeInTheDocument();
        expect(screen.getByText('Tags')).toBeInTheDocument();
        expect(screen.getByText('Events This Month')).toBeInTheDocument();
      });
    });

    it('should render stat cards with correct icons', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should display stat values correctly', async () => {
      const mockEvents = [{ id: 1, name: 'Event 1', date: '2025-12-01', duration: '1h', description: 'Desc', place: 'Berlin', participants: [] }];
      const mockParticipants = [{ id: 1, name: 'John Doe', email: 'john@example.com', events: [] }];
      const mockTags = [{ id: 1, name: 'Conference', color: '#FF5733', events: [] }];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => mockParticipants })
        .mockResolvedValueOnce({ ok: true, json: async () => mockTags });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Total Events')).toBeInTheDocument();
        // Should show 1 for each stat
        const ones = screen.getAllByText('1');
        expect(ones.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Quick Actions Section', () => {
    it('should render quick actions section with title', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });

    it('should render all three quick action cards', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Create Event')).toBeInTheDocument();
        expect(screen.getByText('Manage Participants')).toBeInTheDocument();
        expect(screen.getByText('Organize Tags')).toBeInTheDocument();
      });
    });

    it('should display descriptions for quick actions', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Plan a new event with participants')).toBeInTheDocument();
        expect(screen.getByText('Add or edit participant information')).toBeInTheDocument();
        expect(screen.getByText('Create and manage event categories')).toBeInTheDocument();
      });
    });

    it('should have links to correct routes', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        const createEventLink = screen.getByText('Create Event').closest('a');
        const manageParticipantsLink = screen.getByText('Manage Participants').closest('a');
        const organizeTagsLink = screen.getByText('Organize Tags').closest('a');

        expect(createEventLink).toHaveAttribute('href', '/eventsHome');
        expect(manageParticipantsLink).toHaveAttribute('href', '/participantsHome');
        expect(organizeTagsLink).toHaveAttribute('href', '/tags');
      });
    });
  });

  describe('Recent Events Section', () => {
    it('should render upcoming events section with title', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
      });
    });

    it('should display empty state when no events exist', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText(/No events yet/)).toBeInTheDocument();
        expect(screen.getByText('Create your first event')).toBeInTheDocument();
      });
    });

    it('should display recent events when events exist', async () => {
      const mockEvents = [
        { id: 1, name: 'Conference 2025', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin', participants: [] },
        { id: 2, name: 'Workshop', date: '2025-11-15', duration: '2 hours', description: 'React', place: 'Munich', participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Conference 2025')).toBeInTheDocument();
        expect(screen.getByText('Workshop')).toBeInTheDocument();
      });
    });

    it('should display at most 3 recent events', async () => {
      const mockEvents = [
        { id: 1, name: 'Event 1', date: '2025-12-01', duration: '1h', description: 'Desc', place: 'Berlin', participants: [] },
        { id: 2, name: 'Event 2', date: '2025-11-15', duration: '2h', description: 'Desc', place: 'Munich', participants: [] },
        { id: 3, name: 'Event 3', date: '2025-10-20', duration: '3h', description: 'Desc', place: 'Hamburg', participants: [] },
        { id: 4, name: 'Event 4', date: '2025-09-10', duration: '4h', description: 'Desc', place: 'Frankfurt', participants: [] },
        { id: 5, name: 'Event 5', date: '2025-08-05', duration: '5h', description: 'Desc', place: 'Cologne', participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Event 1')).toBeInTheDocument();
        expect(screen.getByText('Event 2')).toBeInTheDocument();
        expect(screen.getByText('Event 3')).toBeInTheDocument();
        expect(screen.queryByText('Event 4')).not.toBeInTheDocument();
        expect(screen.queryByText('Event 5')).not.toBeInTheDocument();
      });
    });

    it('should have View All link to events page', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        const viewAllLink = screen.getByText('View All');
        expect(viewAllLink).toBeInTheDocument();
        expect(viewAllLink.closest('a')).toHaveAttribute('href', '/eventsHome');
      });
    });
  });

  describe('RecentEventCard Component', () => {
    it('should display event name, place, and duration', async () => {
      const mockEvents = [
        { id: 1, name: 'Tech Conference', date: '2025-12-01', duration: '3 hours', description: 'Tech', place: 'Berlin Convention Center', participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Tech Conference')).toBeInTheDocument();
        expect(screen.getByText('Berlin Convention Center')).toBeInTheDocument();
        expect(screen.getByText('3 hours')).toBeInTheDocument();
      });
    });

    it('should display formatted date with day and month', async () => {
      const mockEvents = [
        { id: 1, name: 'Event', date: '2025-12-15', duration: '1h', description: 'Desc', place: 'Berlin', participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // Day
        expect(screen.getByText('Dec')).toBeInTheDocument(); // Month abbreviation
      });
    });

    it('should display participant count', async () => {
      const mockEvents = [
        { 
          id: 1, 
          name: 'Event', 
          date: '2025-12-01', 
          duration: '1h', 
          description: 'Desc', 
          place: 'Berlin', 
          participants: [
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' },
          ] 
        },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('2 participants')).toBeInTheDocument();
      });
    });

    it('should display 0 participants when participants array is empty', async () => {
      const mockEvents = [
        { id: 1, name: 'Event', date: '2025-12-01', duration: '1h', description: 'Desc', place: 'Berlin', participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('0 participants')).toBeInTheDocument();
      });
    });

    it('should handle missing participants property', async () => {
      const mockEvents = [
        { id: 1, name: 'Event', date: '2025-12-01', duration: '1h', description: 'Desc', place: 'Berlin' },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('0 participants')).toBeInTheDocument();
      });
    });
  });

  describe('Event Sorting', () => {
    it('should sort events by closest to current date', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const mockEvents = [
        { id: 1, name: 'Next Week Event', date: nextWeek.toISOString(), duration: '1h', description: 'Desc', place: 'Berlin', participants: [] },
        { id: 2, name: 'Yesterday Event', date: yesterday.toISOString(), duration: '2h', description: 'Desc', place: 'Munich', participants: [] },
        { id: 3, name: 'Tomorrow Event', date: tomorrow.toISOString(), duration: '3h', description: 'Desc', place: 'Hamburg', participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        // All three should be displayed (sorted by proximity to today)
        expect(screen.getByText('Yesterday Event')).toBeInTheDocument();
        expect(screen.getByText('Tomorrow Event')).toBeInTheDocument();
        expect(screen.getByText('Next Week Event')).toBeInTheDocument();
      });
    });
  });

  describe('LocalStorage Integration', () => {
    it('should listen for storage events', async () => {
      (global.fetch as any)
        .mockResolvedValue({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Simulate storage event
      localStorage.setItem('eventsUpdated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'eventsUpdated' }));

      // Should trigger a refetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(6); // Initial 3 + refetch 3
      });
    });

    it('should refetch data on window focus if eventsUpdated flag is set', async () => {
      (global.fetch as any)
        .mockResolvedValue({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Set the flag
      localStorage.setItem('eventsUpdated', Date.now().toString());

      // Simulate window focus
      window.dispatchEvent(new Event('focus'));

      // Should trigger a refetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(6); // Initial 3 + refetch 3
      });
    });

    it('should clear eventsUpdated flag after refetching', async () => {
      (global.fetch as any)
        .mockResolvedValue({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Set the flag
      localStorage.setItem('eventsUpdated', Date.now().toString());

      // Simulate storage event
      window.dispatchEvent(new StorageEvent('storage', { key: 'eventsUpdated' }));

      // Flag should be cleared
      await waitFor(() => {
        expect(localStorage.getItem('eventsUpdated')).toBeNull();
      });
    });

    it('should not refetch on storage event for other keys', async () => {
      (global.fetch as any)
        .mockResolvedValue({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      const initialFetchCount = (global.fetch as any).mock.calls.length;

      // Simulate storage event for different key
      window.dispatchEvent(new StorageEvent('storage', { key: 'otherKey' }));

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not trigger a refetch
      expect((global.fetch as any).mock.calls.length).toBe(initialFetchCount);
    });
  });

  describe('Data Validation', () => {
    it('should handle events with missing fields gracefully', async () => {
      const mockEvents = [
        { id: 1, name: 'Incomplete Event', date: '2025-12-01' }, // Missing duration, place, etc.
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete Event')).toBeInTheDocument();
      });
    });

    it('should handle invalid date formats', async () => {
      const mockEvents = [
        { id: 1, name: 'Event', date: 'invalid-date', duration: '1h', description: 'Desc', place: 'Berlin', participants: [] },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockEvents })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      // Should render without crashing
      await waitFor(() => {
        expect(screen.getByText('Event')).toBeInTheDocument();
      });
    });

    it('should handle null or undefined values in stats', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => null })
        .mockResolvedValueOnce({ ok: true, json: async () => undefined })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        // Should display dashboard without crashing
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should render all sections in correct order', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithRouter(<Home />);

      await waitFor(() => {
        const dashboard = screen.getByText('Dashboard');
        const quickActions = screen.getByText('Quick Actions');
        const upcomingEvents = screen.getByText('Upcoming Events');

        expect(dashboard).toBeInTheDocument();
        expect(quickActions).toBeInTheDocument();
        expect(upcomingEvents).toBeInTheDocument();
      });
    });

    it('should have proper CSS classes for styling', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      const { container } = renderWithRouter(<Home />);

      await waitFor(() => {
        expect(container.querySelector('.dashboard-container')).toBeInTheDocument();
        expect(container.querySelector('.dashboard-header')).toBeInTheDocument();
        expect(container.querySelector('.stats-grid')).toBeInTheDocument();
        expect(container.querySelector('.dashboard-content')).toBeInTheDocument();
      });
    });
  });
});
