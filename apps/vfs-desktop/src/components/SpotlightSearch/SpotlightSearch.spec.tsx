/**
 * SpotlightSearch Component Tests
 * Tests keyboard shortcuts, navigation, and user interactions
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpotlightSearch } from './SpotlightSearch';
import type { FileMetadata, StorageSource } from '../../types/storage';

// Mock files and sources
const mockFiles: FileMetadata[] = [
  {
    id: '1',
    name: 'test-video.mp4',
    path: '/test-video.mp4',
    size: 1024000,
    lastModified: '2024-01-01T00:00:00Z',
    mimeType: 'video/mp4',
    tierStatus: 'hot',
    canWarm: false,
    canTranscode: true,
    tags: ['video', 'test'],
  },
  {
    id: '2',
    name: 'document.pdf',
    path: '/document.pdf',
    size: 512000,
    lastModified: '2024-01-02T00:00:00Z',
    mimeType: 'application/pdf',
    tierStatus: 'hot',
    canWarm: false,
    canTranscode: false,
    tags: ['document'],
  },
  {
    id: '3',
    name: 'folder',
    path: '/folder/',
    size: 0,
    lastModified: '2024-01-03T00:00:00Z',
    mimeType: 'folder',
    isDirectory: true,
    tierStatus: 'hot',
    canWarm: false,
    canTranscode: false,
  },
];

const mockSources: StorageSource[] = [
  {
    id: 'source1',
    name: 'Test Source',
    type: 'local',
    config: {},
    status: 'connected',
  },
];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  files: mockFiles,
  sources: mockSources,
  onNavigateToFile: jest.fn(),
  onNavigateToPath: jest.fn(),
  onSearchSubmit: jest.fn(),
  currentSourceId: 'source1',
};

describe('SpotlightSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render when open', () => {
      render(<SpotlightSearch {...defaultProps} />);
      expect(screen.getByPlaceholderText(/Search files/i)).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<SpotlightSearch {...defaultProps} isOpen={false} />);
      expect(
        screen.queryByPlaceholderText(/Search files/i),
      ).not.toBeInTheDocument();
    });

    it('should show operator hints when query is empty', () => {
      render(<SpotlightSearch {...defaultProps} />);
      expect(screen.getByText('tag:')).toBeInTheDocument();
      expect(screen.getByText('type:')).toBeInTheDocument();
      expect(screen.getByText('ext:')).toBeInTheDocument();
      expect(screen.getByText('size:')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should close on Escape key', async () => {
      const onClose = jest.fn();
      render(<SpotlightSearch {...defaultProps} onClose={onClose} />);
      const input = screen.getByPlaceholderText(/Search files/i);

      await userEvent.type(input, '{Escape}');
      expect(onClose).toHaveBeenCalled();
    });

    it('should navigate down with ArrowDown', async () => {
      render(<SpotlightSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText(/Search files/i);

      await userEvent.type(input, '{ArrowDown}');
      const results = screen.getAllByRole('button');
      expect(results[1]).toHaveClass('selected');
    });

    it('should navigate up with ArrowUp', async () => {
      render(<SpotlightSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText(/Search files/i);

      // Select second item first
      await userEvent.type(input, '{ArrowDown}');
      // Then navigate up
      await userEvent.type(input, '{ArrowUp}');
      const results = screen.getAllByRole('button');
      expect(results[0]).toHaveClass('selected');
    });

    it('should select result on Enter', async () => {
      const onNavigateToFile = jest.fn();
      render(
        <SpotlightSearch
          {...defaultProps}
          onNavigateToFile={onNavigateToFile}
        />,
      );
      const input = screen.getByPlaceholderText(/Search files/i);

      // Type to show file results
      await userEvent.type(input, 'test');
      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      });

      // Press Enter to select
      await userEvent.type(input, '{Enter}');
      expect(onNavigateToFile).toHaveBeenCalled();
    });

    it('should complete operator on Tab', async () => {
      render(<SpotlightSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        /Search files/i,
      ) as HTMLInputElement;

      // Navigate to operator
      await userEvent.type(input, '{ArrowDown}');
      // Press Tab to complete
      await userEvent.type(input, '{Tab}');

      await waitFor(() => {
        expect(input.value).toBe('tag:');
      });
    });

    it('should submit search query on Enter when no result selected', async () => {
      const onSearchSubmit = jest.fn();
      render(
        <SpotlightSearch {...defaultProps} onSearchSubmit={onSearchSubmit} />,
      );
      const input = screen.getByPlaceholderText(/Search files/i);

      await userEvent.type(input, 'test query');
      await userEvent.type(input, '{Enter}');

      expect(onSearchSubmit).toHaveBeenCalledWith('test query');
    });
  });

  describe('Search Functionality', () => {
    it('should filter files by name', async () => {
      render(<SpotlightSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText(/Search files/i);

      await userEvent.type(input, 'video');
      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
        expect(screen.queryByText('document.pdf')).not.toBeInTheDocument();
      });
    });

    it('should filter files by tag', async () => {
      render(<SpotlightSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText(/Search files/i);

      await userEvent.type(input, 'document');
      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
      });
    });

    it('should show tags in results', async () => {
      render(<SpotlightSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText(/Search files/i);

      await userEvent.type(input, 'test');
      await waitFor(() => {
        const tagResults = screen.getAllByText('test');
        expect(tagResults.length).toBeGreaterThan(0);
      });
    });
  });

  describe('User Interactions', () => {
    it('should close on overlay click', () => {
      const onClose = jest.fn();
      render(<SpotlightSearch {...defaultProps} onClose={onClose} />);
      const overlay = screen.getByRole('generic').parentElement;
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('should not close on container click', () => {
      const onClose = jest.fn();
      render(<SpotlightSearch {...defaultProps} onClose={onClose} />);
      const container = screen
        .getByPlaceholderText(/Search files/i)
        .closest('.spotlight-container');
      if (container) {
        fireEvent.click(container);
        expect(onClose).not.toHaveBeenCalled();
      }
    });

    it('should select result on click', async () => {
      const onNavigateToFile = jest.fn();
      render(
        <SpotlightSearch
          {...defaultProps}
          onNavigateToFile={onNavigateToFile}
        />,
      );
      const input = screen.getByPlaceholderText(/Search files/i);

      await userEvent.type(input, 'test');
      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      });

      const fileResult = screen.getByText('test-video.mp4').closest('button');
      if (fileResult) {
        fireEvent.click(fileResult);
        expect(onNavigateToFile).toHaveBeenCalled();
      }
    });

    it('should update selected index on mouse hover', async () => {
      render(<SpotlightSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText(/Search files/i);

      await userEvent.type(input, 'test');
      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      });

      const results = screen.getAllByRole('button');
      if (results[1]) {
        fireEvent.mouseEnter(results[1]);
        expect(results[1]).toHaveClass('selected');
      }
    });
  });

  describe('Operator Selection', () => {
    it('should insert operator into query when selected', async () => {
      render(<SpotlightSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        /Search files/i,
      ) as HTMLInputElement;

      // Click on tag: operator
      const tagOperator = screen.getByText('tag:').closest('button');
      if (tagOperator) {
        fireEvent.click(tagOperator);
        await waitFor(() => {
          expect(input.value).toBe('tag:');
        });
      }
    });

    it('should keep search open when operator is selected', async () => {
      const onClose = jest.fn();
      render(<SpotlightSearch {...defaultProps} onClose={onClose} />);
      const input = screen.getByPlaceholderText(/Search files/i);

      const tagOperator = screen.getByText('tag:').closest('button');
      if (tagOperator) {
        fireEvent.click(tagOperator);
        await waitFor(() => {
          expect(onClose).not.toHaveBeenCalled();
        });
      }
    });
  });

  describe('Recent Searches', () => {
    it('should save search to recent searches', async () => {
      const onSearchSubmit = jest.fn();
      render(
        <SpotlightSearch {...defaultProps} onSearchSubmit={onSearchSubmit} />,
      );
      const input = screen.getByPlaceholderText(/Search files/i);

      await userEvent.type(input, 'test query');
      await userEvent.type(input, '{Enter}');

      // Check localStorage
      const recentSearches = JSON.parse(
        localStorage.getItem('ursly-recent-searches') || '[]',
      );
      expect(recentSearches).toContain('test query');
    });
  });
});
