import nodemailer from 'nodemailer'
import postmarkTransport from 'nodemailer-postmark-transport'
import { getEnvironment } from '@dtails/toolbox/lib'

export async function sendSupportMail(subject, textBody) {
  const toEmail = getEnvironment('SUPPORT_MAIL')
  await sendMail(toEmail, subject, textBody, [])
}

async function sendMail(toEmail, subject, textBody, attachments) {
  const transport = nodemailer.createTransport(postmarkTransport({
    auth: {
      apiKey: getEnvironment('POSTMARK_API_KEY')
    }
  }))

  let mailSettings = {
    from: getEnvironment('POSTMARK_FROM_EMAIL'),
    to: toEmail,
    subject: `${getEnvironment('ENVIRONMENT_PREFIX')}B2B portal: ${subject}`,
    text: textBody + '\r\n\r\nKind regards from dtails',
    html: null,
    attachments: attachments
  }

  const result = await transport.sendMail(mailSettings)
  if (result.messageId && result.rejected.length == 0) {
    return true
  } else {
    console.log('An error occurred while attempting to send mail', result)
    throw Error('Failed to send email')
  }
}