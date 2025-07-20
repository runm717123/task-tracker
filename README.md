# NDev Task Tracker

[![WXT](https://img.shields.io/badge/WXT-Framework-blue)](https://wxt.dev/)
[![@bios-ui/svelte](https://img.shields.io/npm/v/@bios-ui/svelte?label=@bios-ui/svelte)](https://www.npmjs.com/package/@bios-ui/svelte)


A Chrome extension for task tracking built with WXT and Svelte.

**Published on Chrome Web Store:** https://chromewebstore.google.com/detail/ndev-task-tracker/occmebddclnpjgckigmgkahbckfmmpml

## Development

> **Note:** You may need to update `package.json` to point @bios-ui packages to npm instead of local files before installation.

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

   and if you didn't have nodemon yet

   ```bash
   pnpm install -D nodemon
   ```

2. **For faster summarization loader in development**, update the `wxt.config.ts` to use `public-dev` directory:
   ```typescript
   // In wxt.config.ts, change:
   publicDir: 'public-dev',
   ```

3. Start development server:
   ```bash
   pnpm dev:watch
   ```
   or without nodemon
   ```bash
   pnpm dev
   ```

4. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `/.output/chrome-mv3` folder from your project directory

### Development Workflow

- The development server will automatically rebuild when you make changes
- After any changes, you may need to click the "Reload" button for your extension in `chrome://extensions/`
- The extension will be available in your browser toolbar

## Production Build

To prepare a production release:

1. **Update the version** in `package.json`:
   ```json
   {
     "version": "x.x.x"
   }
   ```

2. **Build for production:**
   ```bash
   pnpm build:prod
   ```
   
   This command will:
   - Build the extension in production mode
   - Create a zip file ready for Chrome Web Store submission
   - Output will be in the `/.output` directory
   
## Project Structure

This Chrome extension has 3 main UI sections:

- **`src/entrypoints/popup/`** - Extension popup UI (when clicking the extension icon)
- **`src/entrypoints/sidepanel/`** - Extension sidepanel UI  
- **`src/entrypoints/new-task-form-popup/`** - Custom task popup UI for new task form

### Folder Structure

- **`src/lib/components/`** - Reusable Svelte components
- **`src/lib/utils/`** - Utility functions
- **`src/types/`** - TypeScript type definitions
- **`src/mocks/`** - Mock data for development
- **`__tests__/`** - Unit tests (placed at same level as tested files)

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm dev:watch` - Start development server with auto-rebuild
- `pnpm build` - Build for development
- `pnpm build:prod` - Build and zip for production
- `pnpm test` - Run unit tests
- `pnpm test:ui` - Run tests with UI
