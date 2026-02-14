import { AxiosError } from 'axios';
import { InvitationError } from '../types';

/**
 * Maps backend error responses to user-friendly messages for invitation flows.
 * Shared by both the token-based and ID-based invitation screens.
 */
export const getErrorFromResponse = (error: unknown): InvitationError => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    const code = data?.code || data?.type || '';
    const status = error.response?.status;

    switch (code) {
      case 'invitation_expired':
        return {
          title: 'Invitation Expired',
          message: 'This invitation has expired. Ask the trip organizer to send a new one.',
        };

      case 'token_expired':
      case 'AUTHENTICATION':
        if (data?.message?.toLowerCase().includes('expired')) {
          return {
            title: 'Invitation Expired',
            message: 'This invitation link has expired. Ask the trip organizer to send a new one.',
          };
        }
        return {
          title: 'Invalid Link',
          message: 'This invitation link is invalid or has been tampered with.',
        };

      case 'invitation_not_pending':
        return {
          title: 'Already Processed',
          message: 'This invitation has already been accepted or declined.',
          action: 'go_to_trips',
        };

      case 'email_mismatch':
        return {
          title: 'Wrong Account',
          message:
            'This invitation was sent to a different email address. Please log in with the correct account.',
          action: 'switch_account',
        };

      case 'auth_mismatch':
        return {
          title: 'Not Authorized',
          message: 'You are not authorized to accept this invitation.',
        };

      case 'already_member':
      case 'CONFLICT':
        return {
          title: 'Already a Member',
          message: "You're already a member of this trip!",
          action: 'go_to_trips',
        };

      case 'NOT_FOUND':
        return {
          title: 'Invitation Not Found',
          message: 'This invitation no longer exists. It may have been revoked.',
        };

      default:
        if (status === 401) {
          return {
            title: 'Session Expired',
            message: 'Your session has expired. Please log in again.',
            action: 'switch_account',
          };
        }
        if (status === 403) {
          return {
            title: 'Access Denied',
            message: 'You do not have permission to accept this invitation.',
          };
        }
        if (status === 404) {
          return {
            title: 'Not Found',
            message: 'This invitation could not be found.',
          };
        }
    }
  }

  return {
    title: 'Something Went Wrong',
    message:
      error instanceof Error
        ? error.message
        : 'Unable to process this invitation. Please try again.',
    action: 'retry',
  };
};
