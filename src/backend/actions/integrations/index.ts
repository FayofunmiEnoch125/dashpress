import {
  ActionIntegrationKeys,
  IActionIntegrationsImplemention,
} from "shared/types/actions";
import { HTTP_ACTION_INTEGRATION } from "./http";
import { MAIL_GUN_ACTION_INTEGRATION } from "./mailgun";
import { POST_MARK_ACTION_INTEGRATION } from "./postmark";
import { SEND_GRID_ACTION_INTEGRATION } from "./sendgrid";
import { SENDINBLUE_ACTION_INTEGRATION } from "./sendinblue";
import { SLACK_ACTION_INTEGRATION } from "./slack";
import { SMTP_ACTION_INTEGRATION } from "./smtp";
import { TWILIO_ACTION_INTEGRATION } from "./twilio";

export const ACTION_INTEGRATIONS: Record<
  ActionIntegrationKeys,
  IActionIntegrationsImplemention
> = {
  [ActionIntegrationKeys.HTTP]: HTTP_ACTION_INTEGRATION,
  [ActionIntegrationKeys.SMTP]: SMTP_ACTION_INTEGRATION,
  [ActionIntegrationKeys.SLACK]: SLACK_ACTION_INTEGRATION,
  [ActionIntegrationKeys.SENDGRID]: SEND_GRID_ACTION_INTEGRATION,
  [ActionIntegrationKeys.MAILGUN]: MAIL_GUN_ACTION_INTEGRATION,
  [ActionIntegrationKeys.TWILIO]: TWILIO_ACTION_INTEGRATION,
  [ActionIntegrationKeys.POSTMARK]: POST_MARK_ACTION_INTEGRATION,
  [ActionIntegrationKeys.SEND_IN_BLUE]: SENDINBLUE_ACTION_INTEGRATION,
};
