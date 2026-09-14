import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
            <h1 className="mt-4 text-xl font-semibold text-white">Something went wrong</h1>
            <p className="mt-2 text-sm text-zinc-500">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
