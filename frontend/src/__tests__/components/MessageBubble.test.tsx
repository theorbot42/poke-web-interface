import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from '../../components/Chat/MessageBubble';
import type { Message } from '../../types';

const baseMessage: Message = {
  id: 'msg-1',
  session_id: 'sess-1',
  role: 'user',
  content: 'Hello, Poke!',
  created_at: '2026-01-01T12:00:00.000Z',
  metadata: {},
};

describe('MessageBubble', () => {
  it('renders user message content', () => {
    render(<MessageBubble message={baseMessage} />);
    expect(screen.getByText('Hello, Poke!')).toBeInTheDocument();
  });

  it('renders assistant message content', () => {
    const msg: Message = { ...baseMessage, role: 'assistant', content: 'Hi there!' };
    render(<MessageBubble message={msg} />);
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('displays the message timestamp', () => {
    render(<MessageBubble message={baseMessage} />);
    // Timestamp should be formatted as HH:mm
    expect(screen.getByText('12:00')).toBeInTheDocument();
  });
});
