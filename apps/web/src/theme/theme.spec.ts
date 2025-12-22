import { theme } from './theme';

describe('theme', () => {
  describe('palette', () => {
    it('should have dark mode', () => {
      expect(theme.palette.mode).toBe('dark');
    });

    it('should have primary color defined', () => {
      expect(theme.palette.primary.main).toBeDefined();
      expect(theme.palette.primary.light).toBeDefined();
      expect(theme.palette.primary.dark).toBeDefined();
    });

    it('should have secondary color defined', () => {
      expect(theme.palette.secondary.main).toBeDefined();
    });

    it('should have background colors defined', () => {
      expect(theme.palette.background.default).toBeDefined();
      expect(theme.palette.background.paper).toBeDefined();
    });

    it('should have status colors defined', () => {
      expect(theme.palette.error.main).toBeDefined();
      expect(theme.palette.success.main).toBeDefined();
      expect(theme.palette.warning.main).toBeDefined();
    });
  });

  describe('typography', () => {
    it('should have font family defined', () => {
      expect(theme.typography.fontFamily).toBeDefined();
      expect(theme.typography.fontFamily).toContain('Inter');
    });

    it('should have heading weights configured', () => {
      expect(theme.typography.h1?.fontWeight).toBe(600);
      expect(theme.typography.h2?.fontWeight).toBe(600);
    });

    it('should have button text transform set to none', () => {
      expect(theme.typography.button?.textTransform).toBe('none');
    });
  });

  describe('shape', () => {
    it('should have border radius defined', () => {
      expect(theme.shape.borderRadius).toBe(8);
    });
  });

  describe('components', () => {
    it('should have MuiButton overrides', () => {
      expect(theme.components?.MuiButton).toBeDefined();
      expect(theme.components?.MuiButton?.styleOverrides).toBeDefined();
    });

    it('should have MuiCard overrides', () => {
      expect(theme.components?.MuiCard).toBeDefined();
      expect(theme.components?.MuiCard?.styleOverrides).toBeDefined();
    });

    it('should have MuiTextField overrides', () => {
      expect(theme.components?.MuiTextField).toBeDefined();
    });

    it('should have MuiPaper overrides', () => {
      expect(theme.components?.MuiPaper).toBeDefined();
    });
  });

  describe('shadows', () => {
    it('should have custom shadows defined', () => {
      expect(theme.shadows).toBeDefined();
      expect(theme.shadows).toHaveLength(25);
    });

    it('should have none for first shadow', () => {
      expect(theme.shadows[0]).toBe('none');
    });
  });
});
