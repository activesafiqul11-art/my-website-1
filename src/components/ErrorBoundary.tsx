import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Handled via fallback UI so the page never renders a blank screen
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-[#09090B] text-[#F4F4F0] flex flex-col items-center justify-center px-6 text-center space-y-4">
          <p className="text-sm text-[#A1A1AA]">
            Something went wrong while rendering this view.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[#E5A93C] px-4 py-2 text-xs font-semibold text-[#09090B]"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
