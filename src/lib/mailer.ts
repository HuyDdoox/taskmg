import nodemailer from 'nodemailer';

function getSmtpConfig() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taskmg-ten.vercel.app';
  return { user, pass, appUrl };
}

export function isMailerConfigured(): boolean {
  const { user, pass } = getSmtpConfig();
  return Boolean(user && pass);
}

function createTransporter() {
  const { user, pass } = getSmtpConfig();
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const { user } = getSmtpConfig();
  const transporter = createTransporter();
  if (!transporter || !user) {
    console.warn(`[Mailer] SMTP chưa cấu hình (thiếu SMTP_USER / SMTP_PASS). Bỏ qua gửi tới ${options.to}`);
    return { sent: false, reason: 'SMTP chưa được cấu hình (cần thêm SMTP_USER và SMTP_PASS trên Vercel)' };
  }

  try {
    await transporter.sendMail({
      from: `"TaskMG Workspace" <${user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return { sent: true };
  } catch (error: any) {
    console.error('[Mailer] Lỗi gửi email:', error?.message || error);
    return { sent: false, reason: error?.message || 'Lỗi kết nối máy chủ Gmail SMTP' };
  }
}

export async function sendOtpEmail(to: string, fullName: string, otp: string) {
  return sendEmail({
    to,
    subject: `[TaskMG] Mã xác nhận Gmail của bạn: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #1D2125; color: #DEE4EA; padding: 28px; border-radius: 12px; border: 1px solid #2C333A;">
        <h2 style="margin: 0 0 12px; color: #579DFF;">Xác nhận địa chỉ Gmail</h2>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Xin chào <strong>${fullName}</strong>,<br/>
          Vui lòng nhập mã OTP 6 số bên dưới để hoàn tất đăng ký tài khoản trên <strong>TaskMG Workspace</strong>:
        </p>
        <div style="background: #22272B; border: 1px dashed #579DFF; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FFFFFF; font-family: monospace;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #8C9BAB; margin: 0;">
          Mã có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.
        </p>
      </div>
    `,
  });
}

export async function sendNotificationEmail(params: {
  to: string;
  recipientName: string;
  title: string;
  message: string;
  projectId?: string | null;
}) {
  const { appUrl } = getSmtpConfig();
  const link = params.projectId ? `${appUrl}/projects/${params.projectId}` : appUrl;
  return sendEmail({
    to: params.to,
    subject: `[TaskMG] ${params.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #1D2125; color: #DEE4EA; padding: 28px; border-radius: 12px; border: 1px solid #2C333A;">
        <div style="font-size: 12px; color: #579DFF; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          TaskMG Notification
        </div>
        <h2 style="margin: 0 0 12px; color: #FFFFFF; font-size: 18px;">${params.title}</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #B6C2CF; margin: 0 0 20px;">
          Xin chào <strong>${params.recipientName}</strong>,<br/><br/>
          ${params.message}
        </p>
        <a href="${link}" style="display: inline-block; background: #0C66E4; color: #FFFFFF; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 13px;">
          Mở trên TaskMG Workspace →
        </a>
        <p style="font-size: 11px; color: #6B778C; margin-top: 24px; border-top: 1px solid #2C333A; padding-top: 12px;">
          Bạn có thể bật/tắt nhận thông báo qua Gmail ngay tại biểu tượng Chuông 🔔 trên thanh Header.
        </p>
      </div>
    `,
  });
}

export async function sendInviteSetPasswordEmail(params: {
  to: string;
  recipientName: string;
  inviterName: string;
  projectName: string;
  projectKey: string;
  role: string;
  inviteToken: string;
}) {
  const { appUrl } = getSmtpConfig();
  const inviteUrl = `${appUrl}/accept-invite?token=${params.inviteToken}`;
  return sendEmail({
    to: params.to,
    subject: `[TaskMG] ${params.inviterName} mời bạn tham gia dự án [${params.projectKey}] ${params.projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #1D2125; color: #DEE4EA; padding: 28px; border-radius: 12px; border: 1px solid #2C333A;">
        <div style="font-size: 12px; color: #579DFF; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Lời mời tham gia dự án
        </div>
        <h2 style="margin: 0 0 12px; color: #FFFFFF; font-size: 18px;">Chào mừng ${params.recipientName}!</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #B6C2CF; margin: 0 0 18px;">
          <strong>${params.inviterName}</strong> vừa mời bạn tham gia dự án
          <strong>[${params.projectKey}] ${params.projectName}</strong> với vai trò <strong>${params.role}</strong>.
        </p>
        <p style="font-size: 13px; color: #9FADBC; margin: 0 0 22px;">
          Bấm nút bên dưới để <strong>tự đặt mật khẩu riêng</strong> và vào thẳng không gian làm việc:
        </p>
        <a href="${inviteUrl}" style="display: inline-block; background: #0C66E4; color: #FFFFFF; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Đặt mật khẩu & Tham gia Dự án →
        </a>
        <p style="font-size: 11px; color: #6B778C; margin-top: 24px; border-top: 1px solid #2C333A; padding-top: 12px;">
          Đường dẫn này có hiệu lực trong <strong>24 giờ</strong>. Nếu nút không bấm được, copy link sau:<br/>
          <span style="color: #579DFF; word-break: break-all;">${inviteUrl}</span>
        </p>
      </div>
    `,
  });
}
