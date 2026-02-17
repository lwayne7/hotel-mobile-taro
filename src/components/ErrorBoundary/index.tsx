import React from 'react';
import { View, Text } from '@tarojs/components';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<Record<string, unknown>>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<Record<string, unknown>>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <Text style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</Text>
          <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
            页面出现了问题
          </Text>
          <Text style={{ fontSize: '14px', color: '#999', marginBottom: '24px' }}>
            {this.state.error?.message || '未知错误'}
          </Text>
          <View
            onClick={this.handleRetry}
            style={{
              padding: '10px 32px',
              backgroundColor: '#1677ff',
              borderRadius: '20px',
            }}
          >
            <Text style={{ color: '#fff', fontSize: '14px' }}>重新加载</Text>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}
