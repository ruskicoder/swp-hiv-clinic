/* globals process */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Debug from '../../components/Debug';

describe('Debug', () => {
  it('should not render when show is false', () => {
    render(<Debug data={{ a: 1 }} show={false} />);
    expect(screen.queryByText('Debug Info')).not.toBeInTheDocument();
  });

  it('should not render in production environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    render(<Debug data={{ a: 1 }} />);
    expect(screen.queryByText('Debug Info')).not.toBeInTheDocument();
    process.env.NODE_ENV = originalEnv;
  });

  it('should render with a title', () => {
    render(<Debug data={{ a: 1 }} title="Test Debug" />);
    expect(screen.getByText('Test Debug:')).toBeInTheDocument();
  });

  it('should render with default title', () => {
    render(<Debug data={{ a: 1 }} />);
    expect(screen.getByText('Debug Info:')).toBeInTheDocument();
  });

  it('should render formatted data', () => {
    const testData = {
      string: 'hello',
      number: 123,
      boolean: true,
      nullValue: null,
      undefinedValue: undefined,
      array: [1, 'two', { three: 3 }],
      object: {
        a: 1,
        b: {
          c: 2,
        },
      },
    };
    render(<Debug data={testData} />);
    const debugData = screen.getByTestId('debug-data')
    expect(debugData.textContent).toContain('"string": "hello"')
    expect(debugData.textContent).toContain('"number": 123')
    expect(debugData.textContent).toContain('"boolean": true')
    expect(debugData.textContent).toContain('"nullValue": null')
    expect(debugData.textContent).toContain('"undefinedValue": "undefined"')
    expect(debugData.textContent).toContain('[')
    expect(debugData.textContent).toContain('1,')
    expect(debugData.textContent).toContain('"two",')
    expect(debugData.textContent).toContain('{')
    expect(debugData.textContent).toContain('"three": 3')
    expect(debugData.textContent).toContain('}')
    expect(debugData.textContent).toContain(']')
    expect(debugData.textContent).toContain('{')
    expect(debugData.textContent).toContain('"a": 1,')
    expect(debugData.textContent).toContain('"b": {')
    expect(debugData.textContent).toContain('"c": 2')
    expect(debugData.textContent).toContain('}')
    expect(debugData.textContent).toContain('}')
  });
});
