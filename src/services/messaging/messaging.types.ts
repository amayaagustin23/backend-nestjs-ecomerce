export const EMAIL_PROVIDER = 'EMAIL_PROVIDER' as const;

export type Email = {
  to: string;
  from: string;
  subject: string;
  body: string;
};

export interface EmailService {
  send(input: Email): Promise<void>;
}
