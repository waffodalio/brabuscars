export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  handled: boolean;
  createdAt: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
  /** Honeypot — leave empty. */
  website?: string;
}
