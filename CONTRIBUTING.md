# Contributing to FitTrack

Thank you for your interest in contributing! This guide will help you get started.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/FitTrack-Workout-tracker.git
   cd FitTrack-Workout-tracker
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```
5. **Start development server**:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── components/     # React components
│   ├── common/    # Reusable UI components
│   ├── layout/    # Layout components
│   └── tracking/  # Workout tracking components
├── context/       # React Context providers
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── utils/         # Utility functions
└── lib/           # Third-party integrations
```

## 🎯 Development Guidelines

### Code Style

- Use **ESLint** for code linting: `npm run lint`
- Fix linting errors: `npm run lint:fix`
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add comments for complex logic

### Component Guidelines

- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Use PropTypes or TypeScript for type checking
- Extract reusable logic into custom hooks
- Follow accessibility best practices

### Accessibility (a11y)

- Use semantic HTML elements
- Include ARIA labels where appropriate
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast (WCAG AA)
- Use the utilities in `src/utils/accessibility.js`

### Performance

- Use React.memo for expensive components
- Implement code splitting for large features
- Optimize images (use WebP, lazy loading)
- Monitor bundle size
- Use the performance monitor: `src/utils/performanceMonitor.js`

## 🧪 Testing

Currently, the project doesn't have automated tests, but you should:

1. Test on multiple browsers (Chrome, Firefox, Safari)
2. Test on mobile devices
3. Test offline functionality (PWA)
4. Verify accessibility with screen readers

## 📝 Commit Guidelines

Use clear, descriptive commit messages:

```
feat: Add water intake tracking
fix: Resolve service worker caching issue
docs: Update README with installation steps
style: Format code with Prettier
refactor: Simplify workout calculation logic
perf: Optimize image loading
```

## 🔧 Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request** on GitHub with:
   - Clear description of changes
   - Screenshots/GIFs for UI changes
   - Reference any related issues

5. **Wait for review** and address feedback

## 🐛 Reporting Bugs

When reporting bugs, please include:

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser and OS information
- Console errors (if any)

## 💡 Suggesting Features

Feature suggestions are welcome! Please:

- Check if the feature is already requested
- Clearly describe the use case
- Explain why it would be valuable
- Consider implementation complexity

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

## ❓ Questions?

Feel free to open an issue for questions or discussions!

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
